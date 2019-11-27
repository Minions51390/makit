import { Stats, MakeDirectoryOptions } from 'fs'
import { Callback } from './callback'

export interface FileSystem {
    stat(path: string, callback: (err: NodeJS.ErrnoException | null, stats: Stats) => void): void;
    statSync(path: string): Stats;

    readFile(path: string, encoding?: string, callback?: (err: Error | null, data: string | Buffer) => void): void;
    readFile(path: string, encoding?: BufferEncoding, callback?: (err: Error | null, data: string) => void): void;

    readFileSync(path: string, encoding?: string): string | Buffer;
    readFileSync(path: string, encoding: BufferEncoding): string;

    writeFile(path: string, data: any, callback: Callback<void>): void;
    writeFileSync(path: string, data: any): void;

    mkdir(path: string, options?: number | string | MakeDirectoryOptions | null, callback?: Callback<void>): void;
    mkdirSync(path: string, options?: number | string | MakeDirectoryOptions | null): void;
}
