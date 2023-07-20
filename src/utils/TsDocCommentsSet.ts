import { getNodeIndent, trimStart } from "./utils";

import {
  TSESTree,
  RuleFixer,
  RuleFix,
  ReportFixFunction,
} from "eslint-redirect/types";

const tsDocTagRegExp = /^[ \t]*(\*|\/{3})*[ \t]*@(?<tag>\w+).*$/;

export class TsDocExcerpt {
  constructor(readonly lines: ITsDocLine[]) {}

  public static findLines(
    criteria: string | RegExp | ((lineValue: string) => boolean),
    excerpts: TsDocExcerpt[]
  ): ITsDocLine[] {
    const foundLines: ITsDocLine[] = [];

    excerpts.forEach((excerpt) => {
      excerpt.lines.forEach((line) => {
        if (isMatch(line.value)) {
          foundLines.push(line);
        }
      });
    });

    function isMatch(line: string): boolean {
      if (typeof criteria === "function") {
        return criteria(line);
      }

      if (criteria instanceof RegExp) {
        return criteria.test(line);
      }

      return criteria === line;
    }

    return foundLines;
  }
}

enum TsDocNodeState {
  Unmodified = 1,
  Updated = 2,
  Added = 3,
  Deleted = 4,
}

abstract class TsDocNode {
  private _idSequence = 0;

  constructor(
    readonly id: number,
    private _state: TsDocNodeState,
    readonly parent?: TsDocNode
  ) {}

  public get state() {
    return this._state;
  }

  public set state(newState: TsDocNodeState) {
    this._state = newState;
  }

  protected getNextId(): number {
    return this._idSequence++;
  }
}

export interface ITsDocLine {
  get value(): string;
  readonly id: number;
}

class TsDocLine extends TsDocNode implements ITsDocLine {
  private _value: string;

  get value() {
    return this._value;
  }

  set value(newValue: string) {
    if (newValue !== this.value) {
      this._value = newValue;
      this.onValueUpdated();
    }
  }

  constructor(
    value: string,
    id: number,
    state: TsDocNodeState,
    parent: TsDocNode
  ) {
    super(id, state, parent);

    this._value = value;
  }

  private onValueUpdated(): void {
    if (this.state === TsDocNodeState.Unmodified) {
      this.state = TsDocNodeState.Updated;
    }
  }
}

class TsDocBlock extends TsDocNode {
  private _lines: TsDocLine[];

  constructor(
    lines: string[],
    id: number,
    state: TsDocNodeState,
    parent: TsDocNode,
    public readonly commentNode?: TSESTree.Comment
  ) {
    super(id, state, parent);

    this._lines = [];
    const lastLineIndex = lines.length - 1;
    lines.forEach((line, index) => {
      if ((index === 0 || index === lastLineIndex) && !line) {
        return;
      }
      this._lines.push(new TsDocLine(line, this.getNextId(), state, this));
    });
  }

  public findTag(searchedTagName: string): TsDocExcerpt[] | undefined {
    if (!this._lines.length) {
      return;
    }

    const docExcerpts: TsDocExcerpt[] = [];
    let currentExcerptLines: TsDocLine[] = [];

    let currentTagName: string | null = null;

    this._lines.forEach((line: TsDocLine) => {
      const match = tsDocTagRegExp.exec(line.value);
      if (!match) {
        if (currentTagName === searchedTagName) {
          currentExcerptLines.push(line);
        }
        return;
      }

      if (currentExcerptLines.length) {
        docExcerpts.push(new TsDocExcerpt(currentExcerptLines));
        currentExcerptLines = [];
      }

      const { tag: commentTagName } = match.groups!;
      currentTagName = commentTagName;

      if (currentTagName === searchedTagName) {
        currentExcerptLines.push(line);
      }
    });

    if (currentExcerptLines.length) {
      docExcerpts.push(new TsDocExcerpt(currentExcerptLines));
    }

    return docExcerpts;
  }

  public setLineValue(line: ITsDocLine, newValue: string) {
    const lineIndex = this.getLineIndexById(line.id);
    if (lineIndex === -1) {
      return;
    }

    this._lines[lineIndex].value = newValue;
    this.updateState();
  }

  public removeLine(line: ITsDocLine) {
    const lineIndex = this.getLineIndexById(line.id);
    if (lineIndex === -1) {
      return;
    }

    if (this._lines[lineIndex].state === TsDocNodeState.Added) {
      this._lines.splice(lineIndex, 1);
    } else {
      this._lines[lineIndex].state = TsDocNodeState.Deleted;
    }

    this.updateState();
  }

  public addLines(lineValues: string[]) {
    const lineIndex = this._lines.length;
    this._addLines(lineIndex, lineValues);
  }

  public addLinesBefore(line: ITsDocLine, lineValues: string[]) {
    const lineIndex = this.getLineIndexById(line.id);
    if (lineIndex === -1) {
      return;
    }

    this._addLines(lineIndex, lineValues);
  }

  public addLinesAfter(line: ITsDocLine, lineValues: string[]) {
    const lineIndex = this.getLineIndexById(line.id);
    if (lineIndex === -1) {
      return;
    }
    this._addLines(lineIndex + 1, lineValues);
  }

  public getContent(indent: string): string {
    let content: string = "";
    let linesCount = 0;
    this._lines
      .filter((line) => line.state !== TsDocNodeState.Deleted)
      .forEach((line) => {
        content += `${indent} * ${line.value}\n`;
        linesCount++;
      });

    if (content) {
      const startIndent = this.state === TsDocNodeState.Added ? indent : "";

      content = `${startIndent}/**\n${content}${indent} */`;
    }

    return content;
  }

  private _addLines(index: number, lineValues: string[]) {
    let newLines: TsDocLine[] = [];
    lineValues.forEach((lineValue) => {
      newLines.push(
        new TsDocLine(lineValue, this.getNextId(), TsDocNodeState.Added, this)
      );
    });
    this._lines.splice(index, 0, ...newLines);
    this.updateState();
  }

  private getLineIndexById(id: number): number {
    let lineIndex = -1;

    this._lines.forEach((line, index) => {
      if (line.id === id) {
        lineIndex = index;
      }
    });

    return lineIndex;
  }

  private updateState() {
    const totalLinesCount = this._lines.length;
    const deletedLinesCount = this.getLinesInState(
      TsDocNodeState.Deleted
    ).length;

    if (totalLinesCount === deletedLinesCount) {
      this.state = TsDocNodeState.Deleted;
      return;
    }

    if (deletedLinesCount > 0) {
      this.state = this.commentNode
        ? TsDocNodeState.Updated
        : TsDocNodeState.Added;
    }

    const updateLinesCount = this.getLinesInState(
      TsDocNodeState.Updated
    ).length;
    const addedLinesCount = this.getLinesInState(TsDocNodeState.Added).length;

    if (deletedLinesCount > 0 || updateLinesCount > 0 || addedLinesCount > 0) {
      this.state = this.commentNode
        ? TsDocNodeState.Updated
        : TsDocNodeState.Added;
    } else {
      this.state = TsDocNodeState.Unmodified;
    }
  }

  private getLinesInState(state: TsDocNodeState): TsDocLine[] {
    return this._lines.filter((line) => line.state === state);
  }
}

export class TsDocCommentsSet extends TsDocNode {
  private blocks: TsDocBlock[];
  private indent: string;

  constructor(
    private parentNode: TSESTree.Node,

    commentNodes: TSESTree.Comment[]
  ) {
    super(0, TsDocNodeState.Unmodified, null);

    this.blocks = [];
    this.indent = getNodeIndent(parentNode);

    commentNodes.forEach((commentNode: TSESTree.Comment) => {
      const commentLines = this.splitAndNormalizeLines(commentNode.value);
      this.blocks.push(
        new TsDocBlock(
          commentLines,
          this.getNextId(),
          TsDocNodeState.Unmodified,
          this,
          commentNode
        )
      );
    });
  }

  private splitAndNormalizeLines(comment: string): string[] {
    const lines: string[] = [];

    comment.split(/\r?\n|\r|\n/g).forEach((commentLine: string) => {
      const normalizedLine = trimStart(commentLine, "/* \t").trimEnd();
      lines.push(normalizedLine);
    });

    return lines;
  }

  public findTag(tagName: string): TsDocExcerpt[] | undefined {
    if (!this.blocks.length) {
      return;
    }

    let docExcerpts: TsDocExcerpt[] = [];

    this.blocks.forEach((block: TsDocBlock) => {
      const blockExcerpts = block.findTag(tagName);
      if (blockExcerpts) {
        docExcerpts = docExcerpts.concat(blockExcerpts);
      }
    });

    return docExcerpts;
  }

  public setLineValue(line: ITsDocLine, newValue: string) {
    this.findBlockAndExec(line, (block: TsDocBlock) => {
      block.setLineValue(line, newValue);
    });
  }

  public removeLine(line: ITsDocLine) {
    this.findBlockAndExec(line, (block: TsDocBlock) => {
      block.removeLine(line);
    });
  }

  public addLines(lineValues: string[]) {
    let block: TsDocBlock;
    for (let i = this.blocks.length - 1; i >= 0; i--) {
      if (this.blocks[i].commentNode) {
        block = this.blocks[i];
        break;
      }
    }

    if (block) {
      block.addLines(lineValues);
    }
  }

  public addLineBefore(line: ITsDocLine, lineValue: string) {
    this.findBlockAndExec(line, (block: TsDocBlock) => {
      block.addLinesBefore(line, [lineValue]);
    });
  }

  public addLinesBefore(line: ITsDocLine, lineValues: string[]) {
    this.findBlockAndExec(line, (block: TsDocBlock) => {
      block.addLinesBefore(line, lineValues);
    });
  }

  public addLineAfter(line: ITsDocLine, lineValue: string) {
    this.findBlockAndExec(line, (block: TsDocBlock) => {
      block.addLinesAfter(line, [lineValue]);
    });
  }

  public addLinesAfter(line: ITsDocLine, lineValues: string[]) {
    this.findBlockAndExec(line, (block: TsDocBlock) => {
      block.addLinesAfter(line, lineValues);
    });
  }

  public createFixer(): ReportFixFunction {
    const docCommentsSet = this;

    return (fixer: RuleFixer) => {
      const fixes: RuleFix[] = [];

      docCommentsSet.blocks
        .filter(
          (block) => block.commentNode && block.state === TsDocNodeState.Deleted
        )
        .forEach((block) => {
          fixes.push(fixer.remove(block.commentNode));
        });

      let previousBlockNode: TsDocBlock = null;

      docCommentsSet.blocks
        .filter((block) => block.state === TsDocNodeState.Updated)
        .forEach((block) => {
          const blockContent = block.getContent(this.indent);

          if (!blockContent) {
            if (block.commentNode) {
              fixes.push(fixer.remove(block.commentNode));
            }
          } else {
            previousBlockNode = block;
            fixes.push(
              fixer.replaceText(
                block.commentNode,
                block.getContent(this.indent)
              )
            );
          }
        });

      docCommentsSet.blocks
        .filter((block) => block.state === TsDocNodeState.Added)
        .forEach((block) => {
          const blockContent = block.getContent(this.indent);

          if (!blockContent) {
            return;
          }

          if (previousBlockNode) {
            fixes.push(
              fixer.insertTextAfter(previousBlockNode.commentNode, blockContent)
            );
          } else {
            fixes.push(fixer.insertTextBefore(this.parentNode, blockContent));
          }
        });

      return fixes;
    };
  }

  private findBlockAndExec(
    line: ITsDocLine,
    action: (block: TsDocBlock) => void
  ) {
    const tsDocLine = line as TsDocLine;
    const block = tsDocLine?.parent as TsDocBlock;

    if (block) {
      action(block);
    }
  }
}
