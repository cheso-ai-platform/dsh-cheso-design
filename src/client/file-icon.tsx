import { fileIconPaths } from './file-icon-paths';

// 彩色文件图标按 vedas_2c 前端 config/file-icons.ts 的 message 场景映射。
const iconFormats: readonly (readonly [keyof typeof fileIconPaths, string])[] = [
  ['png', 'png jpg jpeg gif bmp webp ico tiff tif heic image svg'],
  ['vimg', 'vimg'],
  ['mindmap', 'vboard'],
  ['web', 'html htm'],
  ['xsl', 'csv xls xlsx'],
  ['md', 'md markdown'],
  ['pdf', 'pdf'],
  ['ppt', 'ppt pptx vppt'],
  ['word', 'doc docx text code-preview'],
  ['video', 'mp4 webm ogg mov avi wmv flv m3u8 3gp mkv mpg mpeg video'],
  ['audio', 'mp3 wav m4a aac flac wma opus audio'],
  ['code', 'code js ts jsx tsx py java c cpp cs go rb php swift kt scala rs sh pl lua r dart elm clj erl hs'
    + ' css scss less xml yml yaml json ini toml env sql txt log svelte pug jade ejs hbs njk sass styl'
    + ' dockerfile makefile nginx apache gradle cmake ps1 psm1 bat cmd fish zsh jl ex exs nim cr zig v vb fs ml'
    + ' graphql gql proto rst tex adoc org vue plantuml puml mermaid mmd'],
  ['canvas', 'vcanvas'],
  ['vmotion', 'vmotion'],
];

const iconsByFormat = new Map(
  iconFormats.flatMap(([icon, formats]) => formats.split(' ').map(format => [format, icon] as const)),
);

/** 按文件格式渲染装饰图标，未知格式使用通用文件图标。 */
export function FileIcon({ format }: { format: string }) {
  const icon = iconsByFormat.get(format.trim().toLowerCase()) ?? 'file';
  return (
    <svg width={14} height={14} viewBox="0 0 1024 1024" style={{ flex: 'none' }} aria-hidden="true">
      {fileIconPaths[icon].map((path, index) => <path key={index} {...path} />)}
    </svg>
  );
}
