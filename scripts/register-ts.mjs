// Registers the TypeScript resolve hook (see loaders/ts-resolve.mjs).
import { register } from 'node:module'

register('./loaders/ts-resolve.mjs', import.meta.url)
