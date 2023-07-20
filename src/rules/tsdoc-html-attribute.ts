import type { TSESTree } from "eslint-redirect/types";
import { RuleContext } from "eslint-redirect/types";
import { createEslintRule } from "../utils/create-eslint-rule";
import { PROPERTY_DEFINITION_WITH_ATTR_DECORATOR } from "eslint-redirect/selectors";
import * as utils from "../utils";

export const RULE_NAME = "tsdoc-html-attribute";

export type MessageIds = utils.TsDocHtmlMetadataMessageIds;

export type Options = [
  {
    descriptionPrefix?: string;
    invalidDescriptionRegexp?: string;
  }
];

export const defaultDescriptionPrefix = "HTML Attribute: ";
const defaultInvalidDescriptionRegexpPattern = ".*html\\s*attr[a-z]*\\s*:.*";

export const rule = createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  meta: {
    docs: {
      description:
        "TSDoc comment should specify HTML Attribute name in description of @remarks tag.",
      recommended: "warn",
      // category: "Stylistic Issues",
    },
    messages: {
      missingTsDocComment:
        "TSDoc comment is missing. Should specify HTML attribute name in description of @remarks tag",
      missingTagWithDescription:
        "@remarks tag with HTML attribute name description is missing",
      wrongValue:
        "Wrong HTML attribute name is specified in @remarks tag, expected: {{ expectedValue }}",
      invalidDescription:
        "Invalid HTML attribute name descripion, expected: {{ expectedDescriptionPrefix }}{{ expectedValue }}",
      missingDescription:
        "HTML attribute description is missing, expected: {{ expectedDescriptionPrefix }}{{ expectedValue }}",
      duplicateDescriptions:
        "TSDoc comment contains duplicate HTML attribute descriptions",
    },
    type: "suggestion",
    schema: [],
    fixable: "code",
  },
  defaultOptions: [
    {
      descriptionPrefix: defaultDescriptionPrefix,
    },
  ],
  create: (context: Readonly<RuleContext<MessageIds, Options>>, [options]) => {
    const sourceCode = context.getSourceCode();

    return {
      [PROPERTY_DEFINITION_WITH_ATTR_DECORATOR](
        node: TSESTree.PropertyDefinition
      ) {
        if (!isEligibleNode(node)) {
          return;
        }

        const attrDecorator = utils.getAttributeDecorator(node);
        const expectedDescriptionPrefix: string =
          options.descriptionPrefix || defaultDescriptionPrefix;
        const invalidDescriptionPrefixRegexpPattern: string =
          getInvalidDescriptionPrefixRegexpPattern(
            expectedDescriptionPrefix,
            options.invalidDescriptionRegexp
          );
        const expectedValue = getExpectedValue(node, attrDecorator);
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

function isEligibleNode(node: TSESTree.PropertyDefinition): boolean {
  if (!utils.isPublicProperty(node)) {
    return false;
  }

  const attrDecorator = utils.getAttributeDecorator(node);

  if (!attrDecorator) {
    return false;
  }

  const expectedAttributeName = getExpectedValue(node, attrDecorator);

  if (!expectedAttributeName) {
    return false;
  }

  return true;
}

function getExpectedValue(
  node: TSESTree.PropertyDefinition,
  attrDecorator: TSESTree.Decorator
): string | undefined {
  let attributeName = utils.getHtmlAttributeName(attrDecorator);

  if (!attributeName) {
    const propertyName = utils.getPropertyName(node);

    if (!propertyName) {
      return;
    }
    attributeName = utils.camelToKebabCase(propertyName);
  }

  return attributeName;
}

function getInvalidDescriptionPrefixRegexpPattern(
  htmlAttributePrefixText: string,
  configuredInvalidHtmlAttributePrefixRegexp?: string
): string | undefined {
  if (configuredInvalidHtmlAttributePrefixRegexp) {
    return utils.trimStart(
      utils.trimEnd(configuredInvalidHtmlAttributePrefixRegexp, "$"),
      "^"
    );
  }
  if (htmlAttributePrefixText === defaultDescriptionPrefix) {
    return defaultInvalidDescriptionRegexpPattern;
  }
}

export default rule;
