const { gql } = require('apollo-server')

module.exports = gql`
  interface Person {
    id: ID!
    type: String!
    name: String!
  }

  type Season {
    id: ID!
    type: String!
    name: String!
  }

  type Judge implements Person {
    id: ID!
    type: String!
    name: String!
  }

  type Queen implements Person {
    id: ID!
    type: String!
    name: String!
    url: String
    realName: String
    appearsIn: [Season]
    appearances: [String] @deprecated(reason: "use appearsIn")
  }

  type Query {
    seasons: [Season]
    season(name: String!): Season
    queens(appearsIn: String): [Queen]
    queen(name: String!): Queen
    judges: [Judge]
    judge(name: String!): Judge
  }

  input CreateQueenInput {
    name: String!
    nickname: String
  }

  input UpdateQueenInput {
    id: ID!
    name: String!
    nickname: String
  }

  input AddQueenToSeasonInput {
    queenId: ID!
    seasonId: ID!
  }

  type Mutation {
    createQueen(input: CreateQueenInput!): Queen
    updateQueen(input: UpdateQueenInput!): Queen
    addQueenToSeason(input: AddQueenToSeasonInput!): Season
  }
`
