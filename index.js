const { ApolloServer } = require('apollo-server')
const { Graph } = require('nemesis-db')
const { collect } = require('streaming-iterables')
const typeDefs = require('./types')
const graph = new Graph('redis://localhost/1')

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
      // ideally here we'd be looking into redis directly and index by name
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
    judge: async (obj, args) => findByName(args.name, 'Judge')
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
