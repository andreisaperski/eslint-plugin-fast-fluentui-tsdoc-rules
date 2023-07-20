import {
  TSESTree,
  AST_NODE_TYPES,
  //  AST_NODE_TYPES_C,
} from "eslint-redirect/types";
import {
  RuleContext,
  ReportFixFunction,
  RuleFixer,
} from "eslint-redirect/types";
import { getNodeIndent } from "./utils";
import { TsDocCommentsSet, ITsDocLine, TsDocExcerpt } from "./TsDocCommentsSet";

export type TsDocHtmlMetadataMessageIds =
  | "missingTsDocComment"
  | "missingTagWithDescription"
  | "wrongValue"
  | "missingDescription"
  | "invalidDescription"
  | "duplicateDescriptions";

export interface TsDocHtmlMetadataValidationSettings {
  tsDocTagName: string;
  expectedDescriptionPrefix: string;
  invalidDescriptionPrefixRegexpPattern?: string;
  expectedValue: string;
}

export class TsDocHtmlMetadataValidator {
  validate(
    node: TSESTree.Node,
    nodeComments: TSESTree.Comment[],
    validationSettings: TsDocHtmlMetadataValidationSettings,
    context: Readonly<RuleContext<TsDocHtmlMetadataMessageIds, any>>
  ): boolean {
    const tagName = validationSettings.tsDocTagName;
    const expectedTagDescriptionPrefix =
      validationSettings.expectedDescriptionPrefix;
    const expectedValue = validationSettings.expectedValue;
    const expectedTagDescription = `${expectedTagDescriptionPrefix}${expectedValue}`;

    if (!nodeComments || !nodeComments.length) {
      const fix = this.fixCreatingTsDocBlock(
        tagName,
        expectedTagDescription,
        node
      );
      context.report({
        messageId: "missingTsDocComment",
        node: node,
        fix: fix,
      });
      return;
    }

    const tsDocCommentsSet = new TsDocCommentsSet(node, nodeComments);
    const tagExcerpts = tsDocCommentsSet.findTag(tagName);

    if (!tagExcerpts.length) {
      const fix = this.fixAddingTagWithDescription(
        tagName,
        expectedTagDescription,
        tsDocCommentsSet
      );
      context.report({
        messageId: "missingTagWithDescription",
        node: node,
        fix: fix,
      });
      return;
    }

    const linesWithExpectedTagDescription = TsDocExcerpt.findLines(
      expectedTagDescription,
      tagExcerpts
    );

    if (linesWithExpectedTagDescription.length === 1) {
      return;
    } else if (linesWithExpectedTagDescription.length > 1) {
      const fix = this.fixRemovingDuplicateDescriptions(
        linesWithExpectedTagDescription,
        tsDocCommentsSet
      );
      context.report({
        messageId: "duplicateDescriptions",
        node: node,
        fix: fix,
      });
      return;
    }

    // prefix is valid, but value is invalid
    const linesWithInvalidValue = TsDocExcerpt.findLines(
      (line) => line.startsWith(expectedTagDescriptionPrefix),
      tagExcerpts
    );

    if (linesWithInvalidValue.length) {
      const fix = this.fixInvalidDescriptions(
        tagName,
        expectedTagDescription,
        linesWithInvalidValue,
        tsDocCommentsSet
      );

      context.report({
        messageId: "wrongValue",
        data: {
          expectedValue: expectedValue,
        },
        node: node,
        fix: fix,
      });
      return;
    }

    if (validationSettings.invalidDescriptionPrefixRegexpPattern) {
      // invalid prefix, but valid value
      const invalidPrefixValidValueRegex =
        this.getInvalidTagDescriptionPrefixAndValidValueRegex(
          validationSettings.invalidDescriptionPrefixRegexpPattern,
          expectedValue
        );

      const linesWithInvalidPrefix = TsDocExcerpt.findLines(
        invalidPrefixValidValueRegex,
        tagExcerpts
      );

      if (linesWithInvalidPrefix.length) {
        const fix = this.fixInvalidDescriptions(
          tagName,
          expectedTagDescription,
          linesWithInvalidPrefix,
          tsDocCommentsSet
        );
        context.report({
          messageId: "invalidDescription",
          data: {
            expectedValue: expectedValue,
            expectedDescriptionPrefix: expectedTagDescriptionPrefix,
          },
          node: node,
          fix: fix,
        });
        return;
      }

      // invalid prefix and invalid value
      const invalidPrefixAndValueRegex =
        this.getInvalidTagDescriptionPrefixAndInvalidValueRegex(
          validationSettings.invalidDescriptionPrefixRegexpPattern
        );

      const linesWithInvalidPrefixesAndValue = TsDocExcerpt.findLines(
        invalidPrefixAndValueRegex,
        tagExcerpts
      );

      if (linesWithInvalidPrefixesAndValue.length) {
        const fix = this.fixInvalidDescriptions(
          tagName,
          expectedTagDescription,
          linesWithInvalidPrefixesAndValue,
          tsDocCommentsSet
        );
        context.report({
          messageId: "invalidDescription",
          data: {
            expectedValue: expectedValue,
            expectedDescriptionPrefix: expectedTagDescriptionPrefix,
          },
          node: node,
          fix: fix,
        });
        return;
      }
    }

    // description is missing
    const lastTagExcerpt = tagExcerpts[tagExcerpts.length - 1];
    const missingDescriptionFix = this.fixAddingDescription(
      expectedTagDescription,
      lastTagExcerpt,
      tsDocCommentsSet
    );

    context.report({
      messageId: "missingDescription",
      data: {
        expectedValue: expectedValue,
        expectedDescriptionPrefix: expectedTagDescriptionPrefix,
      },
      node: node,
      fix: missingDescriptionFix,
    });
  }

  private fixCreatingTsDocBlock(
    tagName: string,
    tagDescription: string,
    node: TSESTree.Node
  ): ReportFixFunction {
    const indent = getNodeIndent(node);

    let nodeToInserBefore: TSESTree.Node = node;

    if (
      node.type === AST_NODE_TYPES.PropertyDefinition &&
      node.decorators?.length
    ) {
      nodeToInserBefore = node.decorators[0];
    }

    const tsDocCommentText =
      `/**` +
      `\n${indent} * @${tagName}` +
      `\n${indent} * ${tagDescription}` +
      `\n${indent} */` +
      `\n${indent}`;
    return (fixer: RuleFixer) =>
      fixer.insertTextBefore(nodeToInserBefore, tsDocCommentText);
  }

  private fixAddingTagWithDescription(
    tagName: string,
    tagDescription: string,
    tsDocCommentsSet: TsDocCommentsSet
  ): ReportFixFunction {
    const tagLines: string[] = [`@${tagName}`, tagDescription];
    tsDocCommentsSet.addLines(tagLines);

    return tsDocCommentsSet.createFixer();
  }

  private fixRemovingDuplicateDescriptions(
    duplicateDescriptions: ITsDocLine[],
    tsDocCommentsSet: TsDocCommentsSet
  ): ReportFixFunction {
    for (let i = 1; i < duplicateDescriptions.length; i++) {
      tsDocCommentsSet.removeLine(duplicateDescriptions[i]);
    }

    return tsDocCommentsSet.createFixer();
  }

  private fixInvalidDescriptions(
    tagName: string,
    tagDescription: string,
    invalidDescriptions: ITsDocLine[],
    tsDocCommentsSet: TsDocCommentsSet
  ): ReportFixFunction {
    const updatedLine = invalidDescriptions[0];

    if (updatedLine.value.startsWith(`@${tagName}`)) {
      tsDocCommentsSet.setLineValue(updatedLine, `@${tagName}`);
      tsDocCommentsSet.addLineAfter(updatedLine, tagDescription);
    } else {
      tsDocCommentsSet.setLineValue(updatedLine, tagDescription);
    }

    for (let i = 1; i < invalidDescriptions.length; i++) {
      tsDocCommentsSet.removeLine(invalidDescriptions[i]);
    }

    return tsDocCommentsSet.createFixer();
  }

  private fixAddingDescription(
    tagDescription: string,
    tagExcerpt: TsDocExcerpt,
    tsDocCommentsSet: TsDocCommentsSet
  ): ReportFixFunction {
    const lastLine = tagExcerpt.lines[tagExcerpt.lines.length - 1];
    tsDocCommentsSet.addLineAfter(lastLine, tagDescription);

    return tsDocCommentsSet.createFixer();
  }

  private getInvalidTagDescriptionPrefixAndValidValueRegex(
    invalidTagDescriptionRegexPattern: string,
    expectedValue: string
  ): RegExp {
    const pattern = invalidTagDescriptionRegexPattern + "\\s*" + expectedValue;
    return new RegExp(`^.*${pattern}.*$`, "i");
  }

  private getInvalidTagDescriptionPrefixAndInvalidValueRegex(
    invalidTagDescriptionRegexPattern: string
  ): RegExp {
    const pattern = invalidTagDescriptionRegexPattern + ".*";

    return new RegExp(`^.*${pattern}.*$`, "i");
  }
}
