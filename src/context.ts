import { resolve, dirname } from 'path'
import { MakeDirectoryOptions } from 'fs'
import { Logger, hlTarget } from './utils/logger'
import { IO } from './io'
import { getDependencyFromTarget } from './models/rude'
import { FileSystem } from './fs/file-system'
import { TimeStamp } from './fs/time-stamp'

const logger = Logger.getOrCreate()

interface ContextOptions {
    target: string
    match: RegExpExecArray | null
    root: string
    dependencies?: string[]
    fs: FileSystem
    make: (target: string) => Promise<TimeStamp>
}

export class Context implements FileSystem {
    public readonly target: string
    public readonly match: RegExpExecArray | null
    public dependencies: string[]
    public dynamicDependencies: string[] = []

    private readonly makeImpl: ContextOptions['make']
    private readonly fs: FileSystem
    private readonly root: string

    constructor ({ target, match, root, dependencies = [], fs, make }: ContextOptions) {
        this.root = root
        this.match = match
        this.target = target
        this.dependencies = dependencies
        this.fs = fs
        this.makeImpl = make
    }

    public async make (target: string) {
        logger.debug('RUDE', 'context.make called with', hlTarget(target), 'while making', hlTarget(this.target))
        this.dynamicDependencies.push(target)
        const ret = await this.makeImpl(target)
        return ret
    }

    public async writeDependency () {
        const filepath = getDependencyFromTarget(this.target)
        logger.debug('RUDE', 'writing', filepath, 'with', this.dynamicDependencies)
        await this.outputFile(filepath, JSON.stringify(this.dynamicDependencies))
        await IO.getMTime().setModifiedTime(this.toFullPath(filepath))
    }

    async outputFile (filepath: string, content: string | Buffer) {
        filepath = this.toFullPath(filepath)
        return this.writeFile(filepath, content).catch(async e => {
            if (e.code === 'ENOENT') {
                await this.mkdir(dirname(filepath), { recursive: true })
                return this.writeFile(filepath, content)
            }
            throw e
        })
    }

    outputFileSync (filepath: string, content: string | Buffer) {
        filepath = this.toFullPath(filepath)
        try {
            return this.fs.writeFileSync(filepath, content)
        } catch (e) {
            if (e.code === 'ENOENT') {
                this.fs.mkdirSync(dirname(filepath), { recursive: true })
                return this.writeFileSync(filepath, content)
            }
            throw e
        }
    }

    async readDependency (i: number = 0): Promise<string> {
        if (i >= this.dependencies.length) throw new Error(`cannot get ${i}th dependency,dependencieshis.deps.length} dependencies in total`)
        return this.readFile(this.dependencyFullPath(i))
    }

    readDependencySync (i: number = 0): string {
        if (i >= this.dependencies.length) throw new Error(`cannot get ${i}th dependency,dependencieshis.deps.length} dependencies in total`)
        return this.readFileSync(this.dependencyFullPath(i), 'utf8')
    }

    targetFullPath () {
        return this.toFullPath(this.target)
    }

    targetPath () {
        return this.target
    }

    dependencyFullPath (i: number = 0): string {
        return this.toFullPath(this.dependencies[i])
    }

    dependencyPath (i: number = 0): string {
        return this.dependencies[i]
    }

    writeTarget (content: string) {
        return this.outputFile(this.targetFullPath(), content)
    }

    writeTargetSync (content: string) {
        return this.outputFileSync(this.targetFullPath(), content)
    }

    toFullPath (filename: string) {
        return resolve(this.root, filename)
    }

    /**
     * FileSystem Implements
     */
    async mkdir (filepath: string, options?: number | string | MakeDirectoryOptions | null) {
        return this.fs.mkdir(this.toFullPath(filepath), options)
    }

    mkdirSync (filepath: string, options: number | string | MakeDirectoryOptions | null) {
        return this.fs.mkdirSync(this.toFullPath(filepath), options)
    }

    async writeFile (filepath: string, content: string | Buffer) {
        return this.fs.writeFile(this.toFullPath(filepath), content)
    }

    writeFileSync (filepath: string, content: string | Buffer) {
        return this.fs.writeFileSync(this.toFullPath(filepath), content)
    }

    async readFile (filepath: string, encoding?: BufferEncoding): Promise<string>
    async readFile (filepath: string, encoding = 'utf8'): Promise<string | Buffer> {
        return this.fs.readFile(this.toFullPath(filepath), encoding)
    }

    readFileSync (filepath: string, encoding: BufferEncoding): string
    readFileSync (filepath: string, encoding = 'utf8'): string | Buffer {
        return this.fs.readFileSync(this.toFullPath(filepath), encoding)
    }

    unlinkSync (filepath: string) {
        return this.fs.unlinkSync(this.toFullPath(filepath))
    }

    unlink (filepath: string) {
        return this.fs.unlink(this.toFullPath(filepath))
    }

    exists (filepath: string) {
        return this.fs.exists(this.toFullPath(filepath))
    }

    existsSync (filepath: string) {
        return this.fs.existsSync(this.toFullPath(filepath))
    }

    utimes (filepath: string, atime: number, utime: number) {
        return this.fs.utimes(this.toFullPath(filepath), atime, utime)
    }

    utimesSync (filepath: string, atime: number, utime: number) {
        return this.fs.utimesSync(this.toFullPath(filepath), atime, utime)
    }

    stat (filepath: string) {
        return this.fs.stat(this.toFullPath(filepath))
    }

    statSync (filepath: string) {
        return this.fs.statSync(this.toFullPath(filepath))
    }
}
