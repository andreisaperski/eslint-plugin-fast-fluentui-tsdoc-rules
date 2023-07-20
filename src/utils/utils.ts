import { AST_NODE_TYPES, TSESTree } from "eslint-redirect/types";

export function isPublicProperty(node: TSESTree.PropertyDefinition): boolean {
  return node.accessibility !== "private" && node.accessibility !== "protected";
}

export function getAttributeDecorator(
  node: TSESTree.PropertyDefinition
): TSESTree.Decorator | undefined {
  return getDecoratorByName(node, "attr");
}

export function getDecoratorByName(
  node: TSESTree.PropertyDefinition | TSESTree.ClassDeclaration,
  decoratorName: string
): TSESTree.Decorator | undefined {
  if (!node.decorators) {
    return;
  }

  const matchingDecorator = node.decorators.find((decorator) => {
    const decoratorExpression = decorator.expression;
    if (
      decoratorExpression.type === AST_NODE_TYPES.Identifier &&
      decoratorExpression.name === decoratorName
    ) {
      return true;
    }

    if (
      decoratorExpression.type === AST_NODE_TYPES.CallExpression &&
      decoratorExpression.callee.type === AST_NODE_TYPES.Identifier &&
      decoratorExpression.callee.name === decoratorName
    ) {
      return true;
    }

    return false;
  });

  return matchingDecorator;
}

export function getPropertyName(
  node: TSESTree.PropertyDefinition | TSESTree.Property
): string | undefined {
  if (node.key.type === AST_NODE_TYPES.Identifier) {
    return node.key.name;
  }

  if (
    node.key.type === AST_NODE_TYPES.Literal &&
    typeof node.key.value === "string"
  ) {
    return node.key.value;
  }

  return;
}

export function getPropertyValue(node: TSESTree.Property): string | undefined {
  if (
    node.value.type === AST_NODE_TYPES.Literal &&
    typeof node.value.value === "string"
  ) {
    return node.value.value;
  } else if (node.value.type === AST_NODE_TYPES.TemplateLiteral) {
    const parts: string[] = [];
    node.value.quasis.forEach((item) => {
      if (item.value.raw) {
        parts.push(item.value.raw);
      }
    });
    return parts.join();
  }

  return;
}

export function getHtmlElementName(
  node: TSESTree.VariableDeclaration,
  namePrefix: string
): string | undefined {
  if (!node.declarations || node.declarations.length != 1) {
    return;
  }

  const variableDeclaratorNode = node
    .declarations[0] as TSESTree.VariableDeclarator;

  if (!variableDeclaratorNode) {
    return;
  }

  const initCallExpressionNode =
    variableDeclaratorNode.init as TSESTree.CallExpression;

  if (
    !initCallExpressionNode ||
    !initCallExpressionNode.arguments ||
    initCallExpressionNode.arguments.length != 1
  ) {
    return;
  }

  const argument = initCallExpressionNode.arguments[0];
  if (
    argument.type != AST_NODE_TYPES.ObjectExpression ||
    !argument.properties
  ) {
    return;
  }

  const nameProperty = argument.properties.find(
    (property): property is TSESTree.Property => {
      if (
        property.type === AST_NODE_TYPES.Property &&
        getPropertyName(property) === "name"
      ) {
        return true;
      }
    }
  );

  if (!nameProperty) {
    return;
  }

  const name = getPropertyValue(nameProperty);
  if (!name) {
    return;
  }

  if (!namePrefix) {
    return name;
  }

  return `${namePrefix}${name}`;
}

export function getHtmlAttributeName(
  attrDecorator: TSESTree.Decorator
): string | undefined {
  const expression: TSESTree.LeftHandSideExpression = attrDecorator.expression;

  if (
    expression.type != AST_NODE_TYPES.CallExpression ||
    !expression.arguments ||
    expression.arguments.length != 1
  ) {
    return;
  }

  const argument = expression.arguments[0];
  if (
    argument.type != AST_NODE_TYPES.ObjectExpression ||
    !argument.properties
  ) {
    return;
  }

  const attributeNameProperty = argument.properties.find(
    (property): property is TSESTree.Property => {
      if (
        property.type === AST_NODE_TYPES.Property &&
        getPropertyName(property) === "attribute"
      ) {
        return true;
      }
    }
  );

  if (!attributeNameProperty) {
    return;
  }

  return getPropertyValue(attributeNameProperty);
}

export function camelToKebabCase(camelCaseString: string) {
  return camelCaseString
    .replace(
      /[A-Z]+(?![a-z])|[A-Z]/g,
      ($, ofs) => (ofs ? "-" : "") + $.toLowerCase()
    )
    .replace(/-{2,}/g, "-");
}

export function getNodeIndent(node: TSESTree.Node): string {
  const indentSize = node.loc.start.column;
  const indent = " ".repeat(indentSize);
  return indent;
}

export function trimStart(
  inputString: string,
  trimmedChars: string | Array<string>
): string {
  let start = 0;
  const end = inputString.length;

  while (start < end && trimmedChars.indexOf(inputString[start]) >= 0) ++start;

  return start > 0 ? inputString.substring(start) : inputString;
}

export function trimEnd(
  inputString: string,
  trimmedChars: string | Array<string>
): string {
  let end = inputString.length;

  while (end > 0 && trimmedChars.indexOf(inputString[end - 1]) >= 0) --end;

  return end < inputString.length ? inputString.substring(0, end) : inputString;
}
