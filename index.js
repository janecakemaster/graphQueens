const { ApolloServer, gql } = require('apollo-server')
const { Graph } = require('nemesis-db')
const { collect } = require('streaming-iterables')
const graph = new Graph('redis://localhost/1')

const typeDefs = gql`
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
    appearances: [Season]
  }

  type Query {
    seasons: [Season]
    season(name: String!): Season
    queens: [Queen]
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

const resolvers = {
  Person: {
    __resolveType: () => 'Person'
  },

  Queen: {
    appearances: async (obj) => {
      const appearances = await graph.findEdges({ subject: obj.id, predicate: 'AppearsIn' })
      return appearances.map(async a => graph.findNode(a.object))
    }
  },

  Mutation: {
    createQueen: async (obj, { input }) => graph.createNode({ ...input, type: 'Queen' }),
    updateQueen: async (obj, { input }) => graph.updateNode(input),
    addQueenToSeason: async (obj, { input: { queenId, seasonId } }) => {
      await graph.createEdge({ subject: queenId, predicate: 'AppearsIn', object: seasonId })
      return graph.findNode(seasonId)
    }
  },

  Query: {
    seasons: async () => {
      const nodes = await collect(graph.allNodes())
      return nodes.filter(node => node.type === 'Season')
    },
    queens: async () => {
      const nodes = await collect(graph.allNodes())
      return nodes.filter(node => node.type === 'Queen')
    },
    judges: async () => {
      const nodes = await collect(graph.allNodes())
      return nodes.filter(node => node.type === 'Judge')
    },
    season: async (obj, args) => {
      const nodes = await collect(graph.allNodes())
      return nodes.find(node => node.type === 'Season' && node.name === args.name)
    },
    queen: async (obj, args) => findByName(args.name, 'Queen'),
    judge: async (obj, args) => findByName(args.name, 'Jdge')
  }
}

async function findByName (name, type) {
  const nodes = await collect(graph.allNodes())
  return nodes.find(node => node.type === type && node.name === name)
}

const server = new ApolloServer({ typeDefs, resolvers })

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`)
})
