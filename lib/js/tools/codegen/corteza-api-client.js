import lodash from 'lodash'
import fs from 'fs'
import yaml from 'js-yaml'
import handlebars from 'handlebars'
import { template } from './template.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Get equivalent of __dirname in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let path
if (process.argv.length >= 3) {
  path = process.argv[2]
} else {
  // Assume "standard" dev environment
  // where corteza server source could be found
  // next to this lib
  path = '../../server'
}

const dst = join(__dirname, '../../src/api-clients')

const namespaces = [
  {
    path: `${path}/system/rest.yaml`,
    namespace: 'system',
    className: 'System',
  },
  {
    path: `${path}/compose/rest.yaml`,
    namespace: 'compose',
    className: 'Compose',
  },
  {
    path: `${path}/federation/rest.yaml`,
    namespace: 'federation',
    className: 'Federation',
  },
  {
    path: `${path}/automation/rest.yaml`,
    namespace: 'automation',
    className: 'Automation',
  },
]

namespaces.forEach(({ path, namespace, className }) => {
  console.log(`Generating '${className}' from specs file '${path}'`)

  let spec

  try {
    spec = yaml.load(fs.readFileSync(path)).endpoints
  } catch (err) {
    switch (err.code) {
      case 'ENOENT':
        console.error('Could not find specs file')
        return
    }

    throw err
  }

  if (!spec) {
    console.error('Endpoints are undefined')
    return
  }

  const endpoints = [].concat.apply([], spec.map(e => {
    const { get = [], post = [], path = [] } = e.parameters || {}
    const parentGet = get
    const parentPost = post
    const parentPath = path

    return e.apis.map(a => {
      let { get = [], post = [], path = [] } = a.parameters || {}

      path = [...parentPath, ...path]
      get = [...parentGet, ...get]
      post = [...parentPost, ...post]

      const allvars = [...path, ...get, ...post]

      return {
        title: a.title,
        description: a.description,

        fname: lodash.camelCase(e.entrypoint + ' ' + a.name),
        fargs: allvars.map(v => v.name),

        pathParams: path.map(v => v.name),

        required: allvars.filter(v => v.required).map(v => v.name),

        method: a.method.toLowerCase(),
        path: (e.path + a.path).replace(/\{/g, '${'),

        hasParams: get.length > 0,
        params: get ? get.map(p => p.name) : [],

        hasData: post.length > 0,
        data: post ? post.map(p => p.name) : [],
      }
    })
  }))

  try {
    const tpl = handlebars.compile(template.trimStart())
    let gen = tpl({ endpoints, className, namespace })
    // Remove trailing whitespace from lines while preserving newlines
    gen = gen.replace(/[^\S\n]+$/gm, '')

    fs.writeFileSync(`${dst}/${namespace}.ts`, gen)
  } catch (err) {
    console.error(err)
  }
})
