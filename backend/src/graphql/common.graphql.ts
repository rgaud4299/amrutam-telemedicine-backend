import { gql } from "graphql-tag";

export const commonTypeDefs = gql`
  type PaginationInfo {
    total: Int!
    page: Int!
    limit: Int!
    pages: Int
    totalPages: Int
    hasMore: Boolean
  }

  input PaginationInput {
    page: Int
    limit: Int
  }

 
`;

export const commonResolvers = {};
