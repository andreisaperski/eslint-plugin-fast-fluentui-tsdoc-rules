export const PROPERTY_DEFINITION_WITH_ATTR_DECORATOR =
  "ClassBody > PropertyDefinition:has(" +
  "Decorator:matches(" +
  "[expression.type='Identifier'][expression.name='attr']," +
  "[expression.type='CallExpression'][expression.callee.name='attr']" +
  "))";

export const COMPONENT_DEFINITION_VARIABLE_DECLARATION =
  "ExportNamedDeclaration:has(VariableDeclaration:has(" +
  "VariableDeclarator:matches(" +
  "[id.name='definition'][init.callee.property.name='compose']" +
  ")))";
