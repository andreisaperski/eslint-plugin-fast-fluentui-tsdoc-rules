import { RuleTester } from "eslint-redirect/types";
import rule, {
  MessageIds,
  RULE_NAME,
} from "../../src/rules/tsdoc-html-attribute";

const ruleTester: RuleTester = new RuleTester({
  // @ts-ignore
  parser: require.resolve("@typescript-eslint/parser"),
});

const validDeclarations = [
  `
export declare class WebComponent {
  /**
   * @remarks
   * HTML Attribute: attribute
   */
  @attr
  attribute: string;
}
`,
  `
export declare class WebComponent {
  /**
   * @public
   * @remarks
   * HTML Attribute: attribute
   */
  @attr
  attribute: string;
}
`,
  `
export declare class WebComponent {
  /**
   * @public
   * @remarks
   * HTML Attribute: attribute-new
   */
  @attr({ attribute: 'attribute-new', mode: 'boolean' })
  attribute: string;
}
`,
  `
export declare class WebComponent {
  /**
   * @public
   * @remarks
   * HTML Attribute: attribute
   */
  @attr({ attribute: 'attribute', mode: 'boolean' })
  attributeNew: string;
}
`,
  `
export declare class WebComponent {
  /**
   * @remarks
   * HTML Attribute: attribute-new
   */
  @attr
  attributeNew: string;
}
`,
];

const invalidDeclarations = [
  `
export declare class WebComponent {
  @attr
  attribute: string;
}
`,
  `
export declare class WebComponent {
  /**
   * @public
   */
  @attr
  attribute: string;
}
`,
  `
export declare class WebComponent {
  /**
   * @remarks
   * HTML Attribute: other-name
   */
  @attr
  attribute: string;
}
`,
  `
export declare class WebComponent {
  /**
   * @remarks
   * HTMLattribute: attribute
   */
  @attr
  attribute: string;
}
`,
  `
export declare class WebComponent {
  /**
   * @remarks
   * HTML attribute:attribute
   */
  @attr
  attribute: string;
}
`,
  `
export declare class WebComponent {
  /**
   * @remarks
   */
  @attr
  attribute: string;
}
`,
  `
export declare class WebComponent {
  /**
   * @remarks
   * HTML Attribute: attribute
   * HTML Attribute: attribute
   */
  @attr
  attribute: string;
}
`,
  `
export declare class WebComponent {
  /**
   * @public
   * @remarks
   * HTML Attribute: attribute-new
   */
  @attr({ attribute: 'attribute', mode: 'boolean' })
  attributeNew: string;
}
`,
  `
export declare class WebComponent {
  /**
 * @remarks
 * HTML Attribute: attribute
 */
  @attr
  attributeNew: string;
}
`,
  `
export declare class WebComponent {
  /**
 * @remarks
 * HTML Attribute: \`attribute\`
 */
  @attr
  attribute: string;
}
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
      errors: [{ messageId: wrongValue, data: { expectedValue: "attribute" } }],
      output: validDeclarations[0],
    },
    {
      code: invalidDeclarations[3],
      errors: [
        {
          messageId: invalidDescription,
          data: {
            expectedValue: "attribute",
            expectedDescriptionPrefix: "HTML Attribute: ",
          },
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
            expectedValue: "attribute",
            expectedDescriptionPrefix: "HTML Attribute: ",
          },
        },
      ],
      output: validDeclarations[0],
    },
    {
      code: invalidDeclarations[5],
      errors: [
        {
          messageId: missingDescription,
          data: {
            expectedValue: "attribute",
            expectedDescriptionPrefix: "HTML Attribute: ",
          },
        },
      ],
      output: validDeclarations[0],
    },
    {
      code: invalidDeclarations[6],
      errors: [{ messageId: duplicateDescriptions }],
      output: validDeclarations[0],
    },
    {
      code: invalidDeclarations[7],
      errors: [{ messageId: wrongValue, data: { expectedValue: "attribute" } }],
      output: validDeclarations[3],
    },
    {
      code: invalidDeclarations[8],
      errors: [
        { messageId: wrongValue, data: { expectedValue: "attribute-new" } },
      ],
      output: validDeclarations[4],
    },
    {
      code: invalidDeclarations[9],
      errors: [
        {
          messageId: wrongValue,
          data: {
            expectedValue: "attribute",
            expectedDescriptionPrefix: "HTML Attribute: ",
          },
        },
      ],
      output: validDeclarations[0],
    },
  ],
});
