/**
 * Grab data from RPDR wikia and add to graph
 */

const http = require('http')
const { join, map } = require('bluebird')
const { Graph } = require('nemesis-db')
const { collect } = require('streaming-iterables')
const graph = new Graph('redis://localhost/1')
const wikiaHost = 'http://rupaulsdragrace.wikia.com'

http.get('http://rupaulsdragrace.wikia.com/api/v1/Navigation/Data', (res) => {
  res.setEncoding('utf8')
  let rawData = ''
  res.on('data', (chunk) => { rawData += chunk })
  res.on('end', async () => {
    try {
      const data = JSON.parse(rawData)
      if (!data) {
        throw new Error('failed to parse json')
      }
      const massagedData = massageData(data)
      await join(
        map(massagedData.seasons, season => graph.createNode(season)),
        map(massagedData.queens, queen => graph.createNode(queen)),
        map(massagedData.judges, judge => graph.createNode(judge))
      )

      const { navigation: { wiki } } = data
      const seasons = wiki[1].children
      await map(seasons, async s => {
        const seasonNumber = s.text.substring(1, s.text.indexOf(' '))
        const season = await findByName(`Season ${seasonNumber}`)
        if (season) {
          await map(s.children, async q => {
            const queen = await findByName(q.text)
            if (queen) {
              return graph.createEdge({ subject: queen.id, predicate: 'AppearsIn', object: season.id })
            }
          })
        }
      })
    } catch (e) {
      console.error(e.message)
    }
  })
}).on('error', (err) => {
  console.log('Error: ' + err.message)
})

function massageData (data) {
  const { navigation: { wiki: [seasons, queens, judges] } } = data

  const result = {
    seasons: seasons.children.reduce(getSeasonNodes, []),
    queens: queens.children.reduce(getQueenNodes, []),
    judges: judges.children.reduce(getJudgeNodes, [])
  }

  return result
}

function getSeasonNodes (accumulator, currentVal) {
  const { children, text, href } = currentVal
  if (children) {
    return [...accumulator, ...children.reduce(getSeasonNodes, [])]
  }
  if (href.includes('All_Stars')) {
    return [...accumulator, { type: 'Season', name: `All Stars ${text}`, url: `${wikiaHost}${href}` }]
  }
  return [...accumulator, { type: 'Season', name: text, url: `${wikiaHost}${href}` }]
}

function getQueenNodes (accumulator, currentVal) {
  const { children, text, href } = currentVal
  if (children) {
    return [...accumulator, ...children.reduce(getQueenNodes, [])]
  }
  if (text.includes('Queens')) {
    return accumulator
  }

  return [...accumulator, { type: 'Queen', name: text, url: `${wikiaHost}${href}` }]
}

function getJudgeNodes (accumulator, currentVal) {
  const { children, text, href } = currentVal
  if (children) {
    return [...accumulator, ...children.reduce(getJudgeNodes, [])]
  }
  if (text.includes('Guest')) {
    return accumulator
  }

  return [...accumulator, { type: 'Judge', name: text, url: `${wikiaHost}${href}` }]
}

async function findByName (name) {
  const nodes = await collect(graph.allNodes())
  return nodes.find(node => node.name === name)
}
