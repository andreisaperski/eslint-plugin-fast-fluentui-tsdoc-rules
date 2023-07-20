import { RuleTester } from "eslint-redirect/types";
import rule, {
  MessageIds,
  RULE_NAME,
} from "../../src/rules/tsdoc-html-element";

const ruleTester: RuleTester = new RuleTester({
  // @ts-ignore
  parser: require.resolve("@typescript-eslint/parser"),
});

const validDeclarations = [
  `
/**
 * @remarks
 * HTML Element: \\<fluent-element\\>
 */
export const definition = Base.compose({
  name: \`\${FluentDesignSystem.prefix}-element\`,
  template,
  styles,
});
`,
  `
/**
 * @public
 * @remarks
 * HTML Element: \\<fluent-element\\>
 */
export const definition = Base.compose({
  name: \`\${FluentDesignSystem.prefix}-element\`,
  template,
  styles,
});
`,
];

const invalidDeclarations = [
  `
export const definition = Base.compose({
  name: \`\${FluentDesignSystem.prefix}-element\`,
  template,
  styles,
});
`,
  `
/**
 * @public
 */
export const definition = Base.compose({
  name: \`\${FluentDesignSystem.prefix}-element\`,
  template,
  styles,
});
`,
  `
/**
 * @remarks
 * HTML Element: \\<fluent-attribute\\>
 */
export const definition = Base.compose({
  name: \`\${FluentDesignSystem.prefix}-element\`,
  template,
  styles,
});
`,
  `
/**
 * @remarks
 * HTML Element: \\<fast-element\\>
 */
export const definition = Base.compose({
  name: \`\${FluentDesignSystem.prefix}-element\`,
  template,
  styles,
});
`,
  `
/**
 * @remarks
 * html elem: \\<fast-element\\>
 */
export const definition = Base.compose({
  name: \`\${FluentDesignSystem.prefix}-element\`,
  template,
  styles,
});
`,
  `
/**
 * @remarks
 * HTMLElement: \\<fast-element\\>
 */
export const definition = Base.compose({
  name: \`\${FluentDesignSystem.prefix}-element\`,
  template,
  styles,
});
`,
  `
/**
 * @remarks
 */
export const definition = Base.compose({
  name: \`\${FluentDesignSystem.prefix}-element\`,
  template,
  styles,
});
`,
  `
/**
 * @remarks
 * HTML Element: \\<fluent-element\\>
 * HTML Element: \\<fluent-element\\>
 */
export const definition = Base.compose({
  name: \`\${FluentDesignSystem.prefix}-element\`,
  template,
  styles,
});
`,
  `
/**
 * @remarks
 * HTML Element: fluent-element
 */
export const definition = Base.compose({
  name: \`\${FluentDesignSystem.prefix}-element\`,
  template,
  styles,
});
`,
  `
/**
 * @remarks
 * HTML Element: <fluent-element>
 */
export const definition = Base.compose({
  name: \`\${FluentDesignSystem.prefix}-element\`,
  template,
  styles,
});
`,
];

const missingTsDocComment: MessageIds = "missingTsDocComment";
const missingTagWithDescription: MessageIds = "missingTagWithDescription";
const wrongValue: MessageIds = "wrongValue";
const invalidDescription: MessageIds = "invalidDescription";
const missingDescription: MessageIds = "missingDescription";
const duplicateDescriptions: MessageIds = "duplicateDescriptions";

ruleTester.run(RULE_NAME, rule, {
  valid: validDeclarations,
  invalid: [
    {
      code: invalidDeclarations[0],
      errors: [{ messageId: missingTsDocComment }],
      output: validDeclarations[0],
    },
    {
      code: invalidDeclarations[1],
      errors: [{ messageId: missingTagWithDescription }],
      output: validDeclarations[1],
    },
    {
      code: invalidDeclarations[2],
      errors: [
        {
          messageId: wrongValue,
          data: { expectedValue: "\\<fluent-element\\>" },
        },
      ],
      output: validDeclarations[0],
    },
    {
      code: invalidDeclarations[3],
      errors: [
        {
          messageId: wrongValue,
          data: { expectedValue: "\\<fluent-element\\>" },
        },
      ],
      output: validDeclarations[0],
    },
    {
      code: invalidDeclarations[4],
      errors: [
        {
          messageId: invalidDescription,
          data: {
            expectedValue: "\\<fluent-element\\>",
            expectedDescriptionPrefix: "HTML Element: ",
          },
        },
      ],
      output: validDeclarations[0],
    },
    {
      code: invalidDeclarations[5],
      errors: [
        {
          messageId: invalidDescription,
          data: {
            expectedValue: "\\<fluent-element\\>",
            expectedDescriptionPrefix: "HTML Element: ",
          },
        },
      ],
      output: validDeclarations[0],
    },
    {
      code: invalidDeclarations[6],
      errors: [
        {
          messageId: missingDescription,
          data: {
            expectedValue: "\\<fluent-element\\>",
            expectedDescriptionPrefix: "HTML Element: ",
          },
        },
      ],
      output: validDeclarations[0],
    },
    {
      code: invalidDeclarations[7],
      errors: [
        {
          messageId: duplicateDescriptions,
        },
      ],
      output: validDeclarations[0],
    },
    {
      code: invalidDeclarations[8],
      errors: [
        {
          messageId: wrongValue,
          data: { expectedValue: "\\<fluent-element\\>" },
        },
      ],
      output: validDeclarations[0],
    },
    {
      code: invalidDeclarations[9],
      errors: [
        {
          messageId: wrongValue,
          data: { expectedValue: "\\<fluent-element\\>" },
        },
      ],
      output: validDeclarations[0],
    },
  ],
});
