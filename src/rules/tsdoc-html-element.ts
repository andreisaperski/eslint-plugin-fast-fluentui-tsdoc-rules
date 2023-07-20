import type { TSESTree } from "eslint-redirect/types";
import { RuleContext } from "eslint-redirect/types";
import { createEslintRule } from "../utils/create-eslint-rule";
import { COMPONENT_DEFINITION_VARIABLE_DECLARATION } from "eslint-redirect/selectors";
import * as utils from "../utils";

export const RULE_NAME = "tsdoc-html-element";

export type MessageIds = utils.TsDocHtmlMetadataMessageIds;

export type Options = [
  {
    descriptionPrefix?: string;
    invalidDescriptionRegexp?: string;
    htmlElementNamePrefix?: string;
  }
];

export const defaultDescriptionPrefix = "HTML Element: ";
const defaultInvalidDescriptionRegexpPattern = ".*html\\s*elem[a-z]*\\s*:.*";
export const defaultHtmlElementNamePrefix = "fluent";

export const rule = createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    docs: {
      description:
        "TSDoc comment should specify HTML Element name in description of @remarks tag.",
      recommended: "warn",
      // category: "Stylistic Issues",
    },
    messages: {
      missingTsDocComment:
        "TSDoc comment is missing. Should specify HTML element name in description of @remarks tag",
      missingTagWithDescription:
        "@remarks tag with HTML element name description is missing",
      wrongValue:
        "Wrong HTML element name is specified in @remarks tag, expected: {{ expectedValue }}",
      invalidDescription:
        "Invalid HTML element name descripion, expected: {{ expectedDescriptionPrefix }}{{ expectedValue }}",
      missingDescription:
        "HTML element description is missing, expected: {{ expectedDescriptionPrefix }}{{ expectedValue }}",
      duplicateDescriptions:
        "TSDoc comment contains duplicate HTML element descriptions",
    },
    type: "suggestion",
    schema: [],
    fixable: "code",
  },
  defaultOptions: [
    {
      descriptionPrefix: defaultDescriptionPrefix,
      htmlElementNamePrefix: defaultHtmlElementNamePrefix,
    },
  ],
  create: (context: Readonly<RuleContext<MessageIds, Options>>, [options]) => {
    const sourceCode = context.getSourceCode();

    return {
      [COMPONENT_DEFINITION_VARIABLE_DECLARATION](
        node: TSESTree.ExportNamedDeclaration
      ) {
        if (!isEligibleNode(node)) {
          return;
        }

        const expectedDescriptionPrefix: string =
          options.descriptionPrefix || defaultDescriptionPrefix;
        const invalidDescriptionPrefixRegexpPattern: string =
          getInvalidDescriptionPrefixRegexpPattern(
            expectedDescriptionPrefix,
            options.invalidDescriptionRegexp
          );
        const expectedValuePrefix =
          options.htmlElementNamePrefix || defaultHtmlElementNamePrefix;
        const expectedValue = getExpectedValue(node, expectedValuePrefix);
        const nodeComments = sourceCode.getCommentsBefore(node);

        var validationSettings: utils.TsDocHtmlMetadataValidationSettings = {
          tsDocTagName: "remarks",
          expectedDescriptionPrefix: expectedDescriptionPrefix,
          invalidDescriptionPrefixRegexpPattern:
            invalidDescriptionPrefixRegexpPattern,
          expectedValue: expectedValue,
        };

        const validator = new utils.TsDocHtmlMetadataValidator();
        validator.validate(node, nodeComments, validationSettings, context);
      },
    };
  },
});

function isEligibleNode(node: TSESTree.ExportNamedDeclaration): boolean {
  const variableDeclarationNode =
    node.declaration as TSESTree.VariableDeclaration;
  if (!variableDeclarationNode) {
    return false;
  }
  if (!utils.getHtmlElementName(variableDeclarationNode, "p")) {
    return false;
  }

  return true;
}

function getExpectedValue(
  node: TSESTree.ExportNamedDeclaration,
  namePrefix?: string
): string | undefined {
  const variableDeclarationNode =
    node.declaration as TSESTree.VariableDeclaration;
  if (!variableDeclarationNode) {
    return;
  }
  const elementName = utils.getHtmlElementName(
    variableDeclarationNode,
    namePrefix
  );
  return `\\<${elementName}\\>`;
}

function getInvalidDescriptionPrefixRegexpPattern(
  descriptionPrefix: string,
  configuredInvalidDescriptionPrefixRegexpPattern?: string
): string | undefined {
  if (configuredInvalidDescriptionPrefixRegexpPattern) {
    return utils.trimStart(
      utils.trimEnd(configuredInvalidDescriptionPrefixRegexpPattern, "$"),
      "^"
    );
  }
  if (descriptionPrefix === defaultDescriptionPrefix) {
    return defaultInvalidDescriptionRegexpPattern;
  }
}

export default rule;
