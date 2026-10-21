import { GraphQLScalarType, Kind, ValueNode } from "graphql";
import { telemedicineTypeDefs, telemedicineResolvers } from "./telemedicine.graphql";

export const JSONScalar: GraphQLScalarType = new GraphQLScalarType({
  name: "JSON",
  description: "Arbitrary JSON value",
  serialize: (value: any) => value,
  parseValue: (value: any) => value,
  parseLiteral(ast: ValueNode): any {
    switch (ast.kind) {
      case Kind.STRING:
      case Kind.BOOLEAN:
      case Kind.INT:
      case Kind.FLOAT:
        return (ast as any).value;
      case Kind.OBJECT: {
        const obj: Record<string, any> = {};
        (ast as any).fields.forEach((f: any) => {
          obj[f.name.value] = JSONScalar.parseLiteral(f.value);
        });
        return obj;
      }
      case Kind.LIST:
        return (ast as any).values.map((v: any) => JSONScalar.parseLiteral(v));
      case Kind.NULL:
        return null;
      default:
        return null;
    }
  },
});

const baseTypeDefs = `
  scalar JSON

  type Query {
    health: String
  }
`;

const baseResolvers = {
  JSON: JSONScalar,
  Query: {
    health: () => "UP",
  },
};

export const typeDefs = [baseTypeDefs, telemedicineTypeDefs];
export const resolvers = [baseResolvers, telemedicineResolvers];
