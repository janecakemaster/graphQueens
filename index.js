const { ApolloServer, gql } = require('apollo-server')

const queens = [
  {
    name: 'Aquaria',
    appearances: ['Season 10']
  },
  {
    name: 'Shangela',
    appearances: ['Season 2', 'Season 3', 'All Stars Season 3']
  },
  {
    name: 'RuPaul',
    nickname: 'Mama Ru'
  }
]

const typeDefs = gql`
  type Queen {
    name: String!
    nickname: String
    appearances: [String]
  }

  type Query {
    queens: [Queen]
    queen(name: String!): Queen
  }
`

const resolvers = {
  Query: {
    queens: () => queens,
    queen: (obj, { name }) => queens.find(q => q.name === name)
  }
}

const server = new ApolloServer({ typeDefs, resolvers })

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`)
})
