import { copy } from 'fs-extra'
import { join } from 'path'
import { rimraf } from 'rimraf'
import { readFileSync, readdirSync, writeFileSync } from 'fs'

type genericProps = { IMPORT: string; IMPLEMENTATION: string }
const BASE_TEMPLATE: string = join(process.cwd(), 'scripts', 'generate')
const BASE_TEMPLATES_APP: string = join(process.cwd(), 'starters', 'apps')

export const delay = (milliseconds: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

const [, , inputLanguage]: string[] = process.argv

/**
 * @param input
 * @param to
 */
const copyBase = async (input: string, database: string, provider: string): Promise<string> => {
    const FROM = join(BASE_TEMPLATE, 'template', input)
    const TO = join(BASE_TEMPLATES_APP, `base-${input}-${provider}-${database}`)
    const options = { overwrite: true }
    await copy(FROM, TO, options)
    return TO
}

/**
 *
 */
const cleanTemplates = async (): Promise<void> => {
    try {
        const list = readdirSync(BASE_TEMPLATES_APP)
        for (const iterator of list) {
            await rimraf(join(BASE_TEMPLATES_APP, '/', iterator))
        }
    } catch (e) {
        console.log(`[Error]:`, e)
    }
}

/**
 *
 * @param fullPath
 * @param database
 * @param provider
 */
const replaceZones = async (fullPath: string, database: string, provider: string) => {
    const findApp = readdirSync(`${fullPath}/src`).find((f) => f.startsWith('app'))

    if (!findApp) {
        throw new Error('error found entrypoint')
    }

    const ZONE_PATH_DATABASES = join(BASE_TEMPLATE, 'zones', 'databases', `${database}.json`)
    const ZONE_PATH_PROVIDERS = join(BASE_TEMPLATE, 'zones', 'providers', `${provider}.json`)

    const jsonConstantsDB: genericProps = JSON.parse(readFileSync(ZONE_PATH_DATABASES, 'utf8'))
    const jsonConstantsProvider: genericProps = JSON.parse(readFileSync(ZONE_PATH_PROVIDERS, 'utf8'))

    const pathEntryPoint = join(fullPath, 'src', findApp)
    const textPlain = readFileSync(pathEntryPoint, 'utf8')

    const newTextPlain = textPlain
        .replace(`/** import-zone **/`, jsonConstantsDB.IMPORT + jsonConstantsProvider.IMPORT)
        .replace(`/** provider-replace **/`, jsonConstantsProvider.IMPLEMENTATION)
        .replace(`/** database-replace **/`, jsonConstantsDB.IMPLEMENTATION)
    writeFileSync(pathEntryPoint, newTextPlain)
}

const main = async (): Promise<void> => {
    try {
        const { PROVIDER_DATA, PROVIDER_LIST } = await import('../../packages/cli/src/configuration/index.ts')

        console.log(`Cleaning...`)
        await cleanTemplates()

        for (const database of PROVIDER_DATA) {
            for (const provider of PROVIDER_LIST) {
                await delay(50)
                const full = await copyBase('js', database.value, provider.value)
                await replaceZones(full, database.value, provider.value)
                console.log(`Generated JS 🌟: ${database.value}-${provider.value}`)
            }
        }

        for (const database of PROVIDER_DATA) {
            for (const provider of PROVIDER_LIST) {
                await delay(50)
                const full = await copyBase('ts', database.value, provider.value)
                await replaceZones(full, database.value, provider.value)
                console.log(`Generated TS 👌: ${database.value}-${provider.value}`)
            }
        }

        console.info(`[INFO]: Package ${inputLanguage} created successfully`)
    } catch (err) {
        console.error('[ERROR]:', err?.message)
    }
}

main()
