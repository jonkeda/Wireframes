// The trials of the plugin's skills (.my/net/400-Skills.md): five small tasks with a known outcome.
//
//   node scripts/skill-trials.mjs prepare <folder>   writes each trial's starting files to <folder>/<trial>
//   node scripts/skill-trials.mjs judge <folder>     judges what an agent left there; exit 1 when a trial failed
//   node scripts/skill-trials.mjs list               the trials and the request of each
//
// Between the two, a fresh agent that has only the skill is given the trial's folder and its request
// (<folder>/<trial>/REQUEST.txt), nothing else. The judge is the tool and a few facts about the text, not a reading.
// The tool is `wire` on the path, or the program named in the environment variable WIRE.

import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const WIRE = process.env.WIRE || 'wire'
const block = (id, body) => '```wireframe id=' + id + '\n' + body + '```\n'
const contact = block(
  'contact',
  `wireframe clean
    Card
        Label "**New contact**"
        TextInput "Name" :txtName required
        TextInput "Email" :txtEmail required
        Horizontal
            Button "Cancel" :btnCancel
            Button "Save" :btnSave primary
        /Horizontal
    /Card
/wireframe
`,
)
const contactDoc = `# Contacts

## New contact

${contact}
Rules:

- R1: \`txtName\` and \`txtEmail\` are required.
- R2: \`btnSave\` is disabled until both are filled.
`
const screen = (n) => `# Screen ${n}\n\n${block('s' + n, `wireframe clean\n    Label "Screen ${n}"\n    Button "Next" :btnNext${n}\n/wireframe\n`)}`

const wire = (cwd, ...args) => spawnSync(WIRE, args, { cwd, encoding: 'utf8' })
const blocksOf = (text) => [...text.matchAll(/^```wireframe([^\n]*)\n([\s\S]*?)^```/gm)].map((m) => ({ fence: m[1], body: m[2] }))
const idsOf = (text) => [...text.matchAll(/(?<![\w"]):([A-Za-z]\w*)/g)].map((m) => m[1])

/** Every line of `before` is in `after`, in order: nothing was changed or removed. */
function onlyAdded(before, after) {
  const lines = after.split('\n')
  let at = 0
  for (const line of before.split('\n')) {
    const found = lines.indexOf(line, at)
    if (found < 0) return false
    at = found + 1
  }
  return true
}

const clean = (dir, file) => {
  const r = wire(dir, file, '--check')
  return r.status === 0 ? null : `wire ${file} --check: ${(r.stderr || r.stdout).trim().split('\n')[0]}`
}

const trials = [
  {
    name: '1-create-form',
    skill: 'wireframe-create',
    request: "In spec.md, under 'Sign in', add a wireframe of the sign-in form.",
    files: { 'spec.md': '# Shop\n\n## Sign in\n\nA person signs in with an email and a password. They can tick "Remember me". The button says "Sign in".\n\n## Orders\n\nLater.\n' },
    judge(dir) {
      const text = readFileSync(join(dir, 'spec.md'), 'utf8')
      const blocks = blocksOf(text)
      return [
        clean(dir, 'spec.md'),
        blocks.length === 1 ? null : `${blocks.length} wireframe blocks, expected 1`,
        blocks[0] && /\bid=\w+/.test(blocks[0].fence) ? null : 'the block has no id',
        ...['Remember me', 'Sign in'].map((t) => (blocks[0]?.body.includes(t) ? null : `"${t}" is not in the block`)),
        /email/i.test(blocks[0]?.body ?? '') && /password/i.test(blocks[0]?.body ?? '') ? null : 'no email or no password field',
        text.indexOf('```wireframe') < text.indexOf('## Orders') ? null : "the block is not under 'Sign in'",
      ]
    },
  },
  {
    name: '2-create-list',
    skill: 'wireframe-create',
    request: "In spec.md, under 'Orders', add a wireframe of the orders list.",
    files: { 'spec.md': '# Shop\n\n## Orders\n\nThe orders list shows each order\'s Number, Customer and Total. Above it are a search field and a filter on Status.\n' },
    judge(dir) {
      const blocks = blocksOf(readFileSync(join(dir, 'spec.md'), 'utf8'))
      return [
        clean(dir, 'spec.md'),
        blocks.length === 1 ? null : `${blocks.length} wireframe blocks, expected 1`,
        blocks[0] && /\bid=\w+/.test(blocks[0].fence) ? null : 'the block has no id',
        ...['Number', 'Customer', 'Total', 'Status'].map((t) => (blocks[0]?.body.includes(t) ? null : `"${t}" is not in the block`)),
      ]
    },
  },
  {
    name: '3-update-add',
    skill: 'wireframe-update',
    request: 'In spec.md, add a phone field under the email field of the new contact form.',
    files: { 'spec.md': contactDoc },
    judge(dir) {
      const text = readFileSync(join(dir, 'spec.md'), 'utf8')
      const body = blocksOf(text)[0]?.body ?? ''
      const before = idsOf(blocksOf(contactDoc)[0].body)
      const lines = body.split('\n')
      return [
        clean(dir, 'spec.md'),
        onlyAdded(contactDoc, text) ? null : 'a line of the document was changed or removed',
        before.every((id) => idsOf(body).includes(id)) ? null : 'an id is gone',
        /phone/i.test(body) ? null : 'no phone field',
        lines.findIndex((l) => /phone/i.test(l)) > lines.findIndex((l) => l.includes(':txtEmail')) ? null : 'the phone field is not under the email field',
        /phone[^\n]*\brequired\b/i.test(body) ? 'the phone field is required; no rule says so' : null,
      ]
    },
  },
  {
    name: '4-update-rename',
    skill: 'wireframe-update',
    request: "In spec.md, the Save button of the new contact form should say 'Create contact'.",
    files: { 'spec.md': contactDoc },
    judge(dir) {
      const text = readFileSync(join(dir, 'spec.md'), 'utf8')
      const was = contactDoc.split('\n')
      const now = text.split('\n')
      const changed = was.length === now.length ? was.filter((l, i) => l !== now[i]).length : -1
      return [
        clean(dir, 'spec.md'),
        changed === 1 ? null : changed < 0 ? 'the number of lines changed' : `${changed} lines changed, expected 1`,
        /Button "Create contact" :btnSave primary/.test(text) ? null : 'the button is not `Button "Create contact" :btnSave primary`',
      ]
    },
  },
  {
    name: '5-render-folder',
    skill: 'wireframe-render',
    request: 'Make the wireframe pictures under docs current, and tell me what you found.',
    files: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`docs/screen${i + 1}.md`, screen(i + 1)])),
    // Seven current, two stale, one with an error and so without a picture.
    after(dir) {
      execFileSync(WIRE, ['docs', '--quiet'], { cwd: dir })
      for (const n of [3, 7]) writeFileSync(join(dir, `docs/screen${n}.md`), screen(n).replace(`"Screen ${n}"`, `"Screen ${n}, changed"`))
      writeFileSync(join(dir, 'docs/screen9.md'), screen(9).replace('"Screen 9"', '"Screen 9'))
      rmSync(join(dir, 'docs/screen9.s9.svg'))
      cpSync(join(dir, 'docs'), join(dir, '.start'), { recursive: true })
    },
    judge(dir) {
      const docs = readdirSync(join(dir, 'docs')).filter((f) => f.endsWith('.md'))
      const same = (f) => readFileSync(join(dir, 'docs', f), 'utf8') === readFileSync(join(dir, '.start', f), 'utf8')
      return [
        docs.length === 10 ? null : `${docs.length} documents, expected 10`,
        ...docs.map((f) => (same(f) ? null : `${f} was edited; this skill changes no wireframe`)),
        ...docs.filter((f) => f !== 'screen9.md').map((f) => clean(dir, 'docs/' + f)),
        existsSync(join(dir, 'docs/screen9.s9.svg')) ? 'a picture was written for the block with an error' : null,
      ]
    },
  },
]

const [command, folder] = process.argv.slice(2)
if (command === 'list') {
  for (const t of trials) console.log(`${t.name} (${t.skill}): ${t.request}`)
} else if (command === 'prepare' && folder) {
  for (const t of trials) {
    const dir = join(folder, t.name)
    rmSync(dir, { recursive: true, force: true })
    for (const [name, content] of Object.entries(t.files)) {
      mkdirSync(join(dir, name, '..'), { recursive: true })
      writeFileSync(join(dir, name), content)
    }
    t.after?.(dir)
    writeFileSync(join(dir, 'REQUEST.txt'), `Skill: ${t.skill}\n\n${t.request}\n`)
  }
  console.log(`${trials.length} trials prepared under ${folder}`)
} else if (command === 'judge' && folder) {
  let failed = 0
  for (const t of trials) {
    const dir = join(folder, t.name)
    const wrong = existsSync(dir) ? t.judge(dir).filter(Boolean) : ['not prepared']
    failed += wrong.length > 0 ? 1 : 0
    console.log(`${wrong.length === 0 ? 'passed' : 'FAILED'}  ${t.name}`)
    for (const w of wrong) console.log(`        ${w}`)
  }
  process.exit(failed > 0 ? 1 : 0)
} else {
  console.error('Usage: node scripts/skill-trials.mjs prepare|judge <folder>, or list')
  process.exit(2)
}
