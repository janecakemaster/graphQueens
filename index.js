const { ApolloServer, gql } = require('apollo-server')

const queens = [
  {
    name: 'Aquaria',
    appearances: ['Season 10'],
    fanFave: 'https://www.instagram.com/p/BhfbzGOjS7s/?taken-by=ageofaquaria'

  },
  {
    name: 'Shangela',
    appearances: ['Season 2', 'Season 3', 'All Stars Season 3'],
    fanFave: 'https://www.instagram.com/p/BfTWFIIn8Oh/?taken-by=itsshangela'
  },
  {
    name: 'RuPaul',
    nickname: 'Mama Ru'
  }
]

const typeDefs = gql`
  interface Person {
    name: String!
  }

  type Queen implements Person {
    name: String!
    nickname: String
    appearances: [String]
    fanFave: String
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
