// Cheso `/embed/preview` 页面通过 `postMessage` 协议接受的文件格式。
const embedFormats = new Set([
  ...`vppt vimg vmotion vboard drawnix html htm svg image png jpg jpeg gif bmp webp ico tiff tif heic heif avif apng
  video mp4 webm mov avi wmv flv m3u8 3gp mkv mpg mpeg ogv
  audio mp3 wav ogg oga m4a aac flac wma opus mid midi amr aiff aif caf wv ape mka ac3 dts pcm au ra ram mp2
  pdf docx pptx xls xlsx csv md markdown vue jsx tsx plantuml puml mermaid mmd
  text code code-preview js ts py java c cpp cs go rb php swift kt kotlin scala rs sh pl lua r dart elm clj erl hs
  css scss less xml yml yaml json ini toml env sql txt log svelte pug jade ejs hbs njk sass styl dockerfile makefile
  nginx apache gradle cmake ps1 psm1 bat cmd fish zsh jl ex exs nim cr zig v vb fs ml graphql gql proto rst tex adoc org`
    .split(/\s+/),
]);

/** 检查文件格式是否受 Cheso 内嵌预览协议支持。 */
export function isEmbedFormat(format: string) {
  return embedFormats.has(format);
}
