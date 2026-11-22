window.__ModuleLoader__.load({
  id: "dsh-cheso-design",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react4 = require("react");

// src/embed-format.ts
var embedFormats = /* @__PURE__ */ new Set([
  ...`vppt vimg vmotion vboard drawnix html htm svg image png jpg jpeg gif bmp webp ico tiff tif heic heif avif apng
  video mp4 webm mov avi wmv flv m3u8 3gp mkv mpg mpeg ogv
  audio mp3 wav ogg oga m4a aac flac wma opus mid midi amr aiff aif caf wv ape mka ac3 dts pcm au ra ram mp2
  pdf docx pptx xls xlsx csv md markdown vue jsx tsx plantuml puml mermaid mmd
  text code code-preview js ts py java c cpp cs go rb php swift kt kotlin scala rs sh pl lua r dart elm clj erl hs
  css scss less xml yml yaml json ini toml env sql txt log svelte pug jade ejs hbs njk sass styl dockerfile makefile
  nginx apache gradle cmake ps1 psm1 bat cmd fish zsh jl ex exs nim cr zig v vb fs ml graphql gql proto rst tex adoc org`.split(/\s+/)
]);
function isEmbedFormat(format) {
  return embedFormats.has(format);
}

// src/sites.ts
var CHESO_SITES = {
  global: "https://cheso.ai"
};
function projectSite(projectUrl) {
  if (typeof projectUrl !== "string") return void 0;
  return projectUrl.match(/^(.*)\/agent\/[A-Za-z0-9_-]+\/?$/)?.[1];
}

// src/client/file-icon-paths.ts
var fileIconPaths = {
  png: [
    { "fill": "#535CFF", "d": "M84.687 155.688c0-35.347 28.654-64 64-64h726.436c35.347 0 64 28.653 64 64v726.437c0 35.347-28.653 64-64 64H148.687c-35.346 0-64-28.653-64-64V155.688z" },
    { "fill": "#84A5FF", "d": "M84.687 475.688c0-212.078 171.923-384 384-384h406.436c35.347 0 64 28.653 64 64v726.437c0 35.347-28.653 64-64 64H148.687c-35.346 0-64-28.653-64-64V475.688z" },
    { "fill": "#fff", "d": "M643.725 310.581a52.384 52.384 0 10104.768 0 52.385 52.385 0 10-104.768 0z" },
    { "fill": "#BCCAFB", "d": "M614.406 465.636L498.32 670.605a34.926 34.926 0 00.235 34.771 34.9 34.9 0 0012.764 12.685 34.828 34.828 0 0017.385 4.646h180.448a69.844 69.844 0 0035.405-9.625 69.888 69.888 0 0025.638-26.247 69.911 69.911 0 008.8-35.616 69.863 69.863 0 00-10.47-35.166l-94.048-151.57a34.921 34.921 0 00-47.559-11.624 34.93 34.93 0 00-12.512 12.777z" },
    { "fill": "#fff", "d": "M388.212 395.43L254.454 615.17a69.844 69.844 0 0024.356 96.587 69.823 69.823 0 0035.258 9.58h327.826L448.071 395.744a34.922 34.922 0 00-59.86-.35v.036z" }
  ],
  vimg: [
    { "fill": "#449AA0", "d": "M84.687 155.688c0-35.347 28.654-64 64-64h726.436c35.347 0 64 28.653 64 64v726.437c0 35.347-28.653 64-64 64H148.687c-35.346 0-64-28.653-64-64V155.688z" },
    { "fill": "#5DCCD4", "d": "M84.687 475.688c0-212.078 171.923-384 384-384h406.436c35.347 0 64 28.653 64 64v726.437c0 35.347-28.653 64-64 64H148.687c-35.346 0-64-28.653-64-64V475.688z" },
    { "fill": "#fff", "d": "M695.04 272H328.96A56.963 56.963 0 00272 328.96v366.08a56.96 56.96 0 0016.683 40.275 56.996 56.996 0 0018.48 12.352A56.989 56.989 0 00328.96 752h366.08a56.992 56.992 0 0021.798-4.333 56.937 56.937 0 0018.477-12.352 56.937 56.937 0 0012.352-18.477A56.992 56.992 0 00752 695.04V328.96A56.965 56.965 0 00695.04 272zM728 693.12a35.3 35.3 0 01-10.33 24.55A35.3 35.3 0 01693.12 728H330.88a35.288 35.288 0 01-24.55-10.33A35.294 35.294 0 01296 693.12V330.88A35.281 35.281 0 01330.88 296h362.24a35.294 35.294 0 0124.55 10.33A35.288 35.288 0 01728 330.88v362.24z" },
    { "fill": "#fff", "d": "M263.992 695.046V328.953a64.983 64.983 0 0119.024-45.937 64.983 64.983 0 0145.937-19.024l.007 8.008A56.963 56.963 0 00272 328.96v366.08l.273 5.594a56.99 56.99 0 004.063 16.204 56.996 56.996 0 0030.826 30.829A56.989 56.989 0 00328.96 752h366.08c5.606 0 11.18-.838 16.531-2.464l5.267-1.869a57.103 57.103 0 0014.343-8.595l4.134-3.757a56.824 56.824 0 009.965-13.433l2.387-5.044a56.896 56.896 0 004.058-16.204l.275-5.594V328.96a56.981 56.981 0 00-12.89-36.1l-3.795-4.177a56.966 56.966 0 00-34.643-16.41L695.04 272l.006-8.008a64.98 64.98 0 0145.94 19.024 64.978 64.978 0 0119.02 45.937v366.093a64.925 64.925 0 01-4.96 24.845 65.093 65.093 0 01-14.06 21.095 65.093 65.093 0 01-21.095 14.06 64.925 64.925 0 01-24.845 4.96H328.953a64.91 64.91 0 01-24.844-4.96 65.022 65.022 0 01-21.093-14.06 65.058 65.058 0 01-14.063-21.095 64.974 64.974 0 01-4.96-24.845zM693.12 296a35.294 35.294 0 0124.55 10.33A35.288 35.288 0 01728 330.88v362.24a35.3 35.3 0 01-10.33 24.55 35.286 35.286 0 01-21.1 10.112l-3.45.218H330.88l-3.45-.218a35.288 35.288 0 01-18.555-7.814l-2.544-2.298A35.294 35.294 0 01296 693.12V330.88a35.31 35.31 0 018.031-22.005l2.3-2.544A35.281 35.281 0 01330.88 296h362.24zm-367.41 8.578A27.262 27.262 0 00312 312a27.302 27.302 0 00-8.008 18.984v362.034A27.311 27.311 0 00312 712a27.276 27.276 0 0018.984 8.006h362.034A27.285 27.285 0 00712 712c5.018-5.018 7.904-11.776 8.006-18.867V330.984l-.582-5.273A27.246 27.246 0 00712 312a27.311 27.311 0 00-18.982-8.008H330.984l-5.273.586zm369.336-40.586L695.04 272H328.96l-.007-8.008h366.093z" },
    { "fill": "#fff", "d": "M361.982 627.711h298.242c4.224 0 8.275-1.668 11.264-4.637a15.782 15.782 0 004.666-11.197c0-4.2-1.677-8.227-4.666-11.197a15.982 15.982 0 00-11.264-4.638H361.982a15.98 15.98 0 00-11.265 4.638 15.787 15.787 0 00-4.666 11.197c0 4.2 1.678 8.227 4.666 11.197a15.983 15.983 0 0011.265 4.637zm0 64.289h298.242c4.224 0 8.275-1.67 11.264-4.64a15.776 15.776 0 004.666-11.194 15.79 15.79 0 00-4.666-11.2 15.978 15.978 0 00-11.264-4.633H361.982a15.977 15.977 0 00-11.265 4.633 15.796 15.796 0 00-4.666 11.2c0 4.199 1.678 8.224 4.666 11.194a15.983 15.983 0 0011.265 4.64zm334.562-134.04a15.254 15.254 0 01-9.715-3.404l-62.294-49.483a17.747 17.747 0 00-11.232-3.88 18.479 18.479 0 00-10.595 3.325l-27.88 20.269-136.772-99.759a18.397 18.397 0 00-10.834-3.524c-3.897 0-7.691 1.235-10.834 3.524L336.73 486.15a16.004 16.004 0 01-21.428-2.455 14.767 14.767 0 01-2.723-5.21 14.74 14.74 0 011.383-11.43 14.837 14.837 0 013.89-4.42l79.658-61.12a49.584 49.584 0 0129.951-10.056 48.788 48.788 0 0128.995 9.422l118.372 86.694 9.958-7.126a50.082 50.082 0 0129.909-9.02 50.04 50.04 0 0129.433 10.446l62.214 49.483a15.258 15.258 0 013.828 4.592 15.281 15.281 0 011.753 5.7 14.39 14.39 0 01-.563 5.762 14.522 14.522 0 01-2.784 5.085 15.99 15.99 0 01-12.032 5.462zm-74.956-120.818a53.12 53.12 0 01-29.416-8.827 52.643 52.643 0 01-19.515-23.59 52.273 52.273 0 01-3.03-30.39 52.476 52.476 0 0114.48-26.937 52.998 52.998 0 0127.102-14.392 53.196 53.196 0 0130.577 3.01 52.85 52.85 0 0123.737 19.398 52.32 52.32 0 018.877 29.236c-.02 13.915-5.594 27.255-15.488 37.094-9.9 9.84-23.324 15.377-37.324 15.398zm0-79.728a27.524 27.524 0 00-15.246 4.552 27.272 27.272 0 00-10.128 12.207 27.08 27.08 0 00-1.591 15.742 27.184 27.184 0 007.48 13.965 27.454 27.454 0 0014.03 7.476 27.562 27.562 0 0015.843-1.536 27.375 27.375 0 0012.312-10.03 27.115 27.115 0 004.62-15.14c0-7.21-2.873-14.125-7.993-19.23a27.499 27.499 0 00-19.327-8.006z" }
  ],
  mindmap: [
    { "fill": "#F07000", "d": "M127.394 158.64h534.322a44.8 44.8 0 0144.8 44.8v635.425a44.8 44.8 0 01-44.8 44.8H127.394a44.8 44.8 0 01-44.8-44.8V203.44a44.8 44.8 0 0144.8-44.8z" },
    { "fill": "#FFB253", "d": "M260.162 87.437H723.82l217.273 215.688V896.27c0 14.297-5.721 28.013-15.91 38.125-10.182 10.112-24 15.795-38.406 15.795H260.162c-14.406 0-28.222-5.683-38.409-15.795-10.186-10.112-15.91-23.828-15.91-38.125v-754.91c0-14.3 5.724-28.016 15.91-38.128 10.187-10.112 24.003-15.794 38.409-15.794z" },
    { "fill": "#FFE5C4", "d": "M723.872 87.437l217.274 215.688h-162.95c-14.407 0-28.225-5.681-38.414-15.793-10.182-10.113-15.91-23.828-15.91-38.129V87.437z" },
    { "fill": "#fff", "d": "M398.531 671.322v-220.31c0-42.416 34.397-76.813 76.813-76.813h139v25.625h-139c-28.277 0-51.188 22.91-51.188 51.188v220.31c0 28.281 22.91 51.187 51.188 51.187h139v25.625h-139c-42.416 0-76.813-34.393-76.813-76.812z" },
    { "fill": "#fff", "d": "M606.375 545.2v25.624h-184.5V545.2h184.5z" },
    { "fill": "#fff", "d": "M332.381 501.762H459.19a25.6 25.6 0 0125.6 25.6v66.162a25.6 25.6 0 01-25.6 25.6H332.38a25.6 25.6 0 01-25.6-25.6v-66.162a25.6 25.6 0 0125.6-25.6z" },
    { "fill": "#FFE1BC", "d": "M620.787 328.262h126.809a25.6 25.6 0 0125.6 25.6v66.162a25.6 25.6 0 01-25.6 25.6H620.787a25.6 25.6 0 01-25.6-25.6v-66.162a25.6 25.6 0 0125.6-25.6zM620.787 499.261h126.809a25.6 25.6 0 0125.6 25.6v66.163a25.6 25.6 0 01-25.6 25.6H620.787a25.6 25.6 0 01-25.6-25.6v-66.163a25.6 25.6 0 0125.6-25.6zM620.787 676.512h126.809a25.6 25.6 0 0125.6 25.6v66.163a25.6 25.6 0 01-25.6 25.6H620.787a25.6 25.6 0 01-25.6-25.6v-66.163a25.6 25.6 0 0125.6-25.6z" }
  ],
  web: [
    { "fill": "#655B89", "d": "M84.687 155.688c0-35.347 28.654-64 64-64h726.436c35.347 0 64 28.653 64 64v726.437c0 35.347-28.653 64-64 64H148.687c-35.346 0-64-28.653-64-64V155.688z" },
    { "fill": "#A97CDD", "d": "M84.687 475.688c0-212.078 171.923-384 384-384h406.436c35.347 0 64 28.653 64 64v726.437c0 35.347-28.653 64-64 64H148.687c-35.346 0-64-28.653-64-64V475.688z" },
    { "fill": "#fff", "d": "M510.125 256c140.358.013 254.176 113.768 254.189 254.125-.013 140.358-113.83 254.176-254.19 254.189C369.769 764.3 256.014 650.484 256 510.124 256.013 369.769 369.768 256.014 510.125 256zm-37.687 499.066c8.18 1.248 16.514 2.13 24.937 2.56v-.064c-8.43-.43-16.75-1.248-24.937-2.496zm62.187 1.561c-8.062.794-16.23 1.312-24.5 1.312 8.27 0 16.438-.525 24.5-1.312zm5.625-.627c2.467-.3 4.93-.563 7.375-.934-2.444.37-4.908.633-7.375.934zm-79.812-3.123zm89.625 1.747zm16.624-3.309zm9.876-2.566c2.152-.595 4.309-1.159 6.437-1.811-2.128.652-4.285 1.216-6.437 1.81zm-139.313-1.811c1.946.595 3.91 1.139 5.875 1.69-1.965-.551-3.93-1.095-5.875-1.69zm151.062-1.748c1.753-.588 3.515-1.132 5.25-1.753-1.735.62-3.497 1.165-5.25 1.753zm-162-1.875c1.76.627 3.536 1.216 5.313 1.811-1.777-.595-3.553-1.184-5.313-1.81zm172.875-2.003zm-183.937-2.31zm193.812-1.754c2.432-1.056 4.86-2.112 7.25-3.245-2.39 1.133-4.818 2.189-7.25 3.245zm-205.125-3.245c1.776.839 3.577 1.632 5.376 2.432-1.8-.8-3.6-1.593-5.376-2.432zm216.563-2.131c2.112-1.05 4.235-2.074 6.313-3.187-2.078 1.113-4.201 2.137-6.313 3.187zm-226.375-2.81c1.3.692 2.624 1.332 3.938 2.004-1.314-.672-2.638-1.312-3.938-2.004zm237.375-3.001zm-249.75-4c2.177 1.325 4.405 2.56 6.625 3.814-2.22-1.254-4.449-2.49-6.625-3.814zm-9-5.747zm277.31-1.876c2.433-1.67 4.884-3.308 7.252-5.062-2.368 1.754-4.82 3.392-7.251 5.062zm-285.872-4.128c1.339.98 2.702 1.927 4.062 2.88-1.36-.953-2.723-1.9-4.062-2.88zm295.748-2.937c2.144-1.626 4.288-3.239 6.374-4.935-2.08 1.696-4.23 3.31-6.374 4.935zm-306.248-5.12zm71-164.316c6.906 73.625 40.881 131.221 84.562 163.253 43.7-32.025 77.717-89.612 84.625-163.253H424.687zM344.25 694.125zm333.126-1.376c2.26-2.074 4.506-4.16 6.688-6.31-2.182 2.15-4.429 4.236-6.688 6.31zm-29.19-154.812c-4.788 58.93-24.666 112.373-54.936 154.313 60.99-27.93 105.432-85.46 114.878-154.313h-59.942zM334.125 684.5zm-21.937-146.562c9.301 67.83 52.589 124.687 112.187 153.065-29.76-41.748-49.259-94.727-54-153.065h-58.187zm374.25 146.127zm7.815-8.314zM319.187 668zm384-2.688c.915-1.133 1.799-2.285 2.688-3.437-.89 1.152-1.773 2.304-2.688 3.437zm-398.062-16.064zm411.125-1.747c1.548-2.317 3.09-4.634 4.563-7.002-1.472 2.368-3.015 4.685-4.563 7.002zm12.064-20a258.27 258.27 0 004.313-8.314 257.599 257.599 0 01-4.313 8.313zM286.5 616.874c1.526 3.192 3.156 6.324 4.813 9.437-1.657-3.113-3.287-6.246-4.813-9.437zm456.566-22.188c8.204-22.594 13.286-46.701 14.56-71.812-1.274 25.109-6.356 49.22-14.56 71.812zm-468.941-9zm-3.187-10.874c.643 2.386 1.287 4.767 2 7.124-.713-2.357-1.357-4.738-2-7.124zm-5.063-23.313c.432 2.57.801 5.145 1.312 7.687-.51-2.542-.88-5.117-1.312-7.687zm-3.5-41.375zM423.5 330.375c-59.343 28.603-102.292 85.586-111.375 153.375h58c4.531-58.357 23.805-111.48 53.375-153.375zm85.75-11.25c-43.966 32.19-78.04 90.363-84.687 164.625H594c-6.648-74.264-40.776-132.437-84.75-164.625zm84.75 9.937c30.124 42.089 49.789 95.704 54.378 154.688h59.872C699.02 414.9 654.803 357.196 594 329.062zM449 750.31c3.284.839 6.603 1.55 9.938 2.253-3.335-.704-6.654-1.414-9.938-2.253zm192.248-29.996zM669.19 700zm-340.94-21.69c1.932 2.093 3.874 4.167 5.875 6.19-2.002-2.023-3.943-4.097-5.875-6.19zM313 660.186zm-19.438-29.748zm5.625 9.626zm411.066 16.064c1.542-2.118 3.02-4.275 4.499-6.438-1.478 2.163-2.957 4.32-4.5 6.438zm12.934-19.565zM283.5 610.313zm450.753 5.375c1.197-2.544 2.38-5.097 3.494-7.688-1.113 2.59-2.297 5.144-3.494 7.688zm4.435-9.813z" }
  ],
  xsl: [
    { "fill": "#94E5B4", "d": "M485.368 121.68h414.726a44.8 44.8 0 0144.8 44.8v709.056a44.8 44.8 0 01-44.8 44.8H485.368a44.8 44.8 0 01-44.8-44.8V166.48a44.8 44.8 0 0144.8-44.8z" },
    { "d": "M861.466 318.977H601.253M861.466 532.508H601.253M861.466 425.71H601.253M861.466 745.978H601.253M861.466 639.242H601.253" },
    { "fill": "#138747", "d": "M77.804 163.43c0-23.47 18.113-42.962 41.52-44.68l512.138-37.595c25.965-1.906 48.077 18.645 48.077 44.68v790.581c0 26.035-22.112 46.586-48.077 44.678l-512.138-37.593c-23.407-1.722-41.52-21.21-41.52-44.679V163.43z" },
    { "fill": "#fff", "d": "M216.489 720.429l115.48-177.665L225.373 365.1h84.39l57.74 111.04c8.883 13.324 8.883 22.207 13.325 26.649l13.325-26.65 62.181-111.039h79.949L429.684 542.764l111.04 177.665h-88.832l-66.624-124.366c0-4.442-4.441-8.883-8.883-17.767 0 4.442-4.441 8.884-8.883 17.767L300.88 720.429h-84.39z" }
  ],
  md: [
    { "fill": "#F27217", "d": "M129.247 151.196h531.88a44.8 44.8 0 0144.8 44.8V833.89a44.8 44.8 0 01-44.8 44.8h-531.88a44.8 44.8 0 01-44.8-44.8V195.996a44.8 44.8 0 0144.8-44.8z" },
    { "fill": "#FFA060", "d": "M261.33 79.75h461.844l216.423 216.422v595.162a54.073 54.073 0 01-15.847 38.253 54.094 54.094 0 01-38.259 15.853H261.33a54.095 54.095 0 01-38.258-15.853 54.09 54.09 0 01-15.847-38.253V133.855a54.105 54.105 0 0154.105-54.105z" },
    { "fill": "#fff", "d": "M468.734 369.383l.813 1.937 104.125 240 103.813-240 .813-1.937h65.184v318.56h-57.498V481.07l-87.437 204.876-.813 1.996H549.36l-.875-1.996-87.375-204.688v206.684h-57.562V369.383h65.187z" },
    { "fill": "#FDD1B8", "d": "M723.22 79.75l216.422 216.422H777.325a54.103 54.103 0 01-54.106-54.105V79.75z" }
  ],
  pdf: [
    { "fill": "#FFB987", "d": "M129.247 151.196h531.88a44.8 44.8 0 0144.8 44.8V833.89a44.8 44.8 0 01-44.8 44.8h-531.88a44.8 44.8 0 01-44.8-44.8V195.996a44.8 44.8 0 0144.8-44.8z" },
    { "fill": "#FB5926", "d": "M261.33 79.75h461.844l216.423 216.422v595.162a54.073 54.073 0 01-15.847 38.253 54.094 54.094 0 01-38.259 15.853H261.33a54.095 54.095 0 01-38.258-15.853 54.09 54.09 0 01-15.847-38.253V133.855a54.105 54.105 0 0154.105-54.105z" },
    { "fill": "#fff", "d": "M714.586 606.692c-28.794-2.138-56.519-12.832-78.914-32.08-43.723 9.625-85.313 23.526-126.903 40.635C475.71 674.06 444.784 704 418.124 704c-5.332 0-11.73-1.069-15.996-4.275-11.73-5.35-18.13-17.114-18.13-28.877 0-9.62 2.134-36.353 103.443-80.196 23.46-42.772 41.59-86.614 56.52-132.595-12.797-25.663-40.524-88.753-21.329-120.833 6.398-11.762 19.195-18.178 33.059-17.109 10.664 0 21.328 5.347 27.727 13.902 13.863 19.247 12.796 59.881-5.333 119.763 17.063 32.08 39.457 60.95 66.12 85.545 22.393-4.277 44.787-7.485 67.18-7.485 50.125 1.07 57.588 24.595 56.519 38.495 0 36.357-35.187 36.357-53.318 36.357zm-298.595 66.3l3.2-1.069c14.93-5.35 26.66-16.045 35.191-29.945-15.996 6.419-28.793 17.113-38.391 31.014zm141.832-320.797h-3.198c-1.067 0-3.2 0-4.266 1.069-4.266 18.179-1.067 37.427 6.398 54.535 6.399-18.178 6.399-37.426 1.066-55.604zm7.465 155.05l-1.066 2.14-1.066-1.07c-9.598 24.594-20.262 49.188-31.992 72.713l2.132-1.069v2.139c23.461-8.554 49.055-16.04 72.516-21.386l-1.066-1.07h3.199c-15.996-16.04-30.926-34.218-42.657-52.397zm145.035 56.674c-9.6 0-18.131 0-27.731 2.14 10.662 5.346 21.331 7.485 31.994 8.553 7.462 1.07 14.93 0 21.33-2.138 0-3.208-4.268-8.555-25.593-8.555z" },
    { "fill": "#FDD1B8", "d": "M723.22 79.75l216.422 216.422H777.325a54.103 54.103 0 01-54.106-54.105V79.75z" }
  ],
  ppt: [
    { "fill": "#FFB987", "d": "M487.04 117.836h403.368a44.8 44.8 0 0144.8 44.8v701.46a44.8 44.8 0 01-44.8 44.8H487.039a44.8 44.8 0 01-44.8-44.8v-701.46a44.8 44.8 0 0144.8-44.8z" },
    { "fill": "#FBE9E7", "d": "M576.681 632.254h320.42v45.276H576.68v-45.276zm0 91.426h320.42v46.144H576.68V723.68zm137.572-410.977c-75.752 0-137.572 61.82-137.572 137.573 0 75.752 61.82 137.572 137.572 137.572 75.75 0 137.574-61.82 137.574-137.572H714.253V312.703z" },
    { "fill": "#FBE9E7", "d": "M759.546 266.508v137.654h137.65c0-75.797-61.855-137.654-137.65-137.654z" },
    { "fill": "#FB5926", "d": "M87.64 159.47c0-23.454 18.089-42.938 41.477-44.678l498.587-37.087c25.98-1.933 48.123 18.625 48.123 44.676V904.43c0 26.054-22.144 46.611-48.123 44.678L129.117 912.02c-23.388-1.74-41.477-21.222-41.477-44.678V159.469z" },
    { "fill": "#fff", "d": "M376.943 344.328h-126.63v367.634h78.634V585.333h40.848c43.912 0 78.633-11.233 104.163-34.72 25.53-22.467 38.806-53.104 38.806-89.867 0-77.612-45.954-116.418-135.82-116.418zm-14.297 177.69h-33.7V407.644h33.7c42.891 0 64.336 18.382 64.336 56.166 0 39.827-21.445 58.21-64.336 58.21z" }
  ],
  word: [
    { "fill": "#3878C1", "d": "M129.247 151.196h531.88a44.8 44.8 0 0144.8 44.8V833.89a44.8 44.8 0 01-44.8 44.8h-531.88a44.8 44.8 0 01-44.8-44.8V195.996a44.8 44.8 0 0144.8-44.8z" },
    { "fill": "#60AAFF", "d": "M261.33 79.75h461.844l216.423 216.422v595.162a54.073 54.073 0 01-15.847 38.253 54.094 54.094 0 01-38.259 15.853H261.33a54.095 54.095 0 01-38.258-15.853 54.09 54.09 0 01-15.847-38.253V133.855a54.105 54.105 0 0154.105-54.105z" },
    { "fill": "#fff", "d": "M689.498 384c17.676 0 32 14.327 32 32 0 17.673-14.324 32-32 32h-273.5c-17.672 0-32-14.327-32-32 0-17.673 14.328-32 32-32h273.5zM689.498 500.75c17.676 0 32 14.327 32 32 0 17.673-14.324 32-32 32h-273.5c-17.672 0-32-14.327-32-32 0-17.673 14.328-32 32-32h273.5zM595.25 607.25c17.665.008 32 14.332 32 32 0 17.665-14.335 31.995-32 32.001H415.998c-17.673 0-32-14.33-32-32.001 0-17.673 14.327-32 32-32h179.25z" },
    { "fill": "#C5E0FF", "d": "M723.22 79.75l216.422 216.422H777.325a54.103 54.103 0 01-54.106-54.105V79.75z" }
  ],
  video: [
    { "fill": "#3F79ED", "d": "M127.376 158.64h534.322a44.8 44.8 0 0144.8 44.8v635.425a44.8 44.8 0 01-44.8 44.8H127.376a44.8 44.8 0 01-44.8-44.8V203.44a44.8 44.8 0 0144.8-44.8z" },
    { "fill": "#86BCFF", "d": "M260.134 87.437h463.661L941.07 303.125v593.137c0 14.304-5.722 28.02-15.91 38.132-10.19 10.112-24 15.795-38.407 15.795H260.134c-14.405 0-28.222-5.683-38.408-15.795-10.187-10.112-15.91-23.828-15.91-38.132V141.36c0-14.3 5.723-28.016 15.91-38.128 10.186-10.112 24.003-15.794 38.408-15.794z" },
    { "fill": "#CEE1FF", "d": "M723.866 87.437l217.273 215.688H778.182c-14.406 0-28.224-5.681-38.406-15.793-10.189-10.113-15.91-23.828-15.91-38.129V87.437z" },
    { "fill": "#fff", "d": "M673.325 505.907c22.38 12.825 22.38 45.1 0 57.925L521.73 650.72c-22.255 12.755-49.981-3.315-49.981-28.964V447.983c0-25.65 27.727-41.717 49.981-28.962l151.594 86.886z" }
  ],
  audio: [
    { "fill": "#5349C7", "d": "M127.419 154.031h534.617a44.8 44.8 0 0144.8 44.8v641.101a44.8 44.8 0 01-44.8 44.8H127.419a44.8 44.8 0 01-44.8-44.8v-641.1a44.8 44.8 0 0144.8-44.8z" },
    { "fill": "#8686FF", "d": "M260.318 82.312h463.88l217.376 217.376v597.778a54.347 54.347 0 01-54.342 54.349H260.318a54.353 54.353 0 01-38.426-15.917 54.35 54.35 0 01-15.918-38.432v-760.81a54.343 54.343 0 0154.344-54.344z" },
    { "fill": "#BEB8FD", "d": "M724.09 82.312l217.376 217.376H778.438a54.363 54.363 0 01-38.432-15.917 54.356 54.356 0 01-15.916-38.427V82.312z" },
    { "fill": "#fff", "d": "M597.398 355.062v345.75H546.21v-345.75h51.188zm-94.813 53.688v238.373h-51.187V408.75h51.187zm198.19 0v238.373h-51.188V408.75h51.187zm-291.815 65.5v107.312h-51.25V474.25h51.25zm380.749 0v107.312h-51.187V474.25h51.187z" }
  ],
  code: [
    { "fill": "#068BFF", "d": "M127.378 158.64H661.7a44.8 44.8 0 0144.8 44.8v635.425a44.8 44.8 0 01-44.8 44.8H127.378a44.8 44.8 0 01-44.8-44.8V203.44a44.8 44.8 0 0144.8-44.8z" },
    { "fill": "#7CC2FF", "d": "M260.13 87.437h463.665l217.267 215.688v593.137c0 14.304-5.721 28.02-15.904 38.132-10.188 10.112-24.006 15.795-38.412 15.795H260.13c-14.406 0-28.223-5.683-38.41-15.795-10.186-10.112-15.909-23.828-15.909-38.132V141.36c0-14.3 5.723-28.016 15.91-38.128 10.186-10.112 24.003-15.794 38.409-15.794z" },
    { "fill": "#fff", "d": "M544.264 674.464c0 7.635-3.13 14.957-8.704 20.365-5.581 5.395-13.147 8.429-21.035 8.429-7.887 0-15.452-3.034-21.033-8.43l-99.614-96.452C387.553 592.25 384 583.943 384 575.28c0-8.662 3.553-16.97 9.878-23.095l99.614-96.451c5.642-5.09 13.105-7.862 20.816-7.73 7.711.131 15.069 3.156 20.522 8.436 5.454 5.28 8.577 12.404 8.714 19.87.135 7.467-2.727 14.693-7.984 20.157l-81.358 78.813 81.358 78.812c5.573 5.408 8.704 12.73 8.704 20.371zM609.544 663.45a28.943 28.943 0 016.896-9.357l81.358-78.85-81.358-78.775c-5.257-5.464-8.12-12.69-7.984-20.156.137-7.467 3.26-14.59 8.714-19.871 5.453-5.28 12.81-8.305 20.522-8.437 7.71-.131 15.172 2.64 20.817 7.731l99.61 96.451c6.329 6.126 9.881 14.433 9.881 23.095 0 8.662-3.552 16.97-9.882 23.095l-99.61 96.453a29.778 29.778 0 01-9.663 6.675 30.498 30.498 0 01-11.588 2.49c-3.996.07-7.966-.64-11.672-2.093a29.767 29.767 0 01-9.9-6.343 28.774 28.774 0 01-6.552-9.587 27.997 27.997 0 01-2.161-11.302c.07-3.866.945-7.687 2.572-11.22z" },
    { "fill": "#BEE1FF", "d": "M723.86 87.437l217.273 215.688H778.176c-14.406 0-28.218-5.681-38.406-15.793-10.19-10.113-15.91-23.828-15.91-38.129V87.437z" }
  ],
  file: [
    { "fill": "#F27217", "d": "M84.687 155.688c0-35.347 28.654-64 64-64h726.436c35.347 0 64 28.653 64 64v726.437c0 35.347-28.653 64-64 64H148.687c-35.346 0-64-28.653-64-64V155.688z" },
    { "fill": "#FFA060", "d": "M84.687 475.688c0-212.078 171.923-384 384-384h406.436c35.347 0 64 28.653 64 64v726.437c0 35.347-28.653 64-64 64H148.687c-35.346 0-64-28.653-64-64V475.688z" },
    { "fill": "#fff", "d": "M585.437 256c11.122 0 16.742-.008 21.938 1.313 4.594 1.174 8.976 3.144 12.937 5.75 4.479 2.954 8.276 7.088 15.75 15.312l127.253 140.063c6.567 7.224 9.901 10.875 12.25 15 2.067 3.65 3.635 7.593 4.563 11.687 1.043 4.639.998 9.589.998 19.375v253.126l-.064 15.814c-.217 13.914-1.126 22.38-4.627 29.248l-3.5 5.747a42.75 42.75 0 01-15.124 12.941l-3.622 1.562c-8.749 3.11-20.563 3.123-41.504 3.123H362.813c-23.923 0-35.917-.032-45.063-4.685-6.026-3.078-11.244-7.52-15.187-12.94l-3.5-5.748c-3.492-6.867-4.408-15.347-4.625-29.248l-.063-15.814V324.438c0-20.943.006-32.752 3.125-41.5l1.562-3.563A42.865 42.865 0 01312 264.188l5.75-3.5c9.146-4.654 21.142-4.688 45.063-4.688h222.624zm-247.25 43.25c-.166.015-.348.05-.5.063-.014.158-.048.325-.062.5-.407 4.984-.437 11.957-.438 24.625v393.188c0 12.672.03 19.641.438 24.627.013.166.049.345.063.499.15.013.333.045.5.058 4.982.41 11.966.441 24.625.441h349.872c12.665 0 19.641-.032 24.627-.441.18-.013.397-.045.563-.058.013-.154.045-.333.064-.5.403-4.985.435-11.954.435-24.626V464.438h-60.627c-11.597 0-21.619-.019-29.811-.688-8.445-.692-16.852-2.258-24.936-6.375-12.068-6.154-21.974-15.93-28.125-28-4.115-8.084-5.559-16.554-6.25-25-.669-8.203-.688-18.26-.688-29.875v-75.687H362.813c-12.659 0-19.643.03-24.625.437zM630.75 374.5c0 12.318.007 20.316.5 26.375.474 5.793 1.274 8 1.812 9.062a21.618 21.618 0 009.376 9.376c1.07.537 3.29 1.28 8.999 1.75 6.048.492 14.029.562 26.31.562h24.378l-71.375-75.25V374.5z" }
  ],
  canvas: [
    { "fill": "#3C288C", "d": "M84.687 155.75c0-35.346 28.654-64 64-64h726.436c35.347 0 64 28.654 64 64v726.439c0 35.347-28.653 64-64 64H148.687c-35.346 0-64-28.653-64-64v-726.44z" },
    { "fill": "#9389E7", "d": "M84.687 475.75c0-212.077 171.923-384 384-384h406.436c35.347 0 64 28.654 64 64v726.439c0 35.347-28.653 64-64 64H148.687c-35.346 0-64-28.653-64-64v-406.44z" },
    { "fill": "#fff", "d": "M539.281 421.5c4.371.404 10.068 2.448 14.188 7.813 3.681 4.805 4.185 9.858 4.187 12.562-.002 3.742-.962 7.157-1.5 8.938-.666 2.203-1.521 4.551-2.437 6.812-1.848 4.559-4.378 10.007-7.188 15.812-5.645 11.663-13.1 26.123-20.312 40.125-2.216 4.303-4.317 8.652-6.438 12.813 9.905-6.175 20.606-12.577 30.5-17.313 5.85-2.796 12.129-5.402 18.187-6.937 4.206-1.062 9.793-2.024 15.688-1.312l6 1.375 5 2.25c10.758 6.085 14.688 17.728 16.313 24 2.224 8.598 2.967 18.655 3.437 27 .517 9.203.697 16.45 1.375 22.687.033.293.093.606.125.875a34.179 34.179 0 005.25-.75c1.757-.407 3.004-.822 3.563-1.063 9.68-4.302 21.06.017 25.373 9.688 4.307 9.69-.058 21.068-9.747 25.375-6.163 2.734-14.547 4.74-22.564 5.187-6.998.387-19.538-.017-29-8.124-5.55-4.762-7.826-11.07-8.875-14.626-1.203-4.08-1.824-8.473-2.25-12.375-.826-7.574-1.14-17.24-1.562-24.75-.4-7.087-1.08-12.837-1.938-17.187-2.15.766-4.788 1.866-7.812 3.313-9.45 4.524-20.598 11.326-31.938 18.5-10.797 6.83-22.367 14.349-30.937 19.125-4.02 2.238-9.165 4.959-14.062 6.25-2.114.554-7.334 1.753-13.188 0-3.42-1.034-7.218-3.17-10.188-6.813-2.896-3.565-4.087-7.474-4.5-10.562-.58-4.398.228-8.373.688-10.313.579-2.438 1.392-4.96 2.25-7.312 1.731-4.742 4.209-10.323 6.938-16.188 2.732-5.873 6.074-12.37 9.5-19.188-24.49 25.493-52.123 55.862-77 84.938-6.9 8.03-19.016 9.01-27.063 2.125-8.04-6.89-8.934-19.009-2.063-27.063 32.807-38.342 70.285-78.856 99.688-108.25 14.607-14.601 27.624-26.837 37.187-34.75 4.496-3.717 9.421-7.477 13.813-9.75 1.196-.616 2.792-1.36 4.625-1.937 1.666-.522 4.842-1.349 8.687-1z" },
    { "fill": "#fff", "fillOpacity": ".68", "d": "M310.25 286.75h402.876V231.5h51.252v55.25h49.932V338h-49.932v388.752h49.932v51.245h-49.932v51.75h-51.252v-51.75H310.25v51.75H259v-51.75h-50.375v-51.245H259V338h-50.375v-51.25H259V231.5h51.25v55.25zm0 51.25v388.752h402.876V338H310.25z" }
  ],
  vmotion: [
    { "fill": "#6060F5", "d": "M84.687 155.688c0-35.347 28.654-64 64-64h726.436c35.347 0 64 28.653 64 64v726.437c0 35.347-28.653 64-64 64H148.687c-35.346 0-64-28.653-64-64V155.688z" },
    { "fill": "#93A1F2", "d": "M84.687 475.688c0-212.078 171.923-384 384-384h406.436c35.347 0 64 28.653 64 64v726.437c0 35.347-28.653 64-64 64H148.687c-35.346 0-64-28.653-64-64V475.688z" },
    { "fill": "#fff", "d": "M708.186 298.102c22.028.012 39.923 17.913 39.942 39.937v361.814l-.813 8c-3.718 18.189-19.84 31.865-39.13 31.872H327.938l-8.062-.813c-15.595-3.194-27.878-15.462-31.062-31.06l-.813-8V338.04c.015-19.277 13.695-35.405 31.875-39.125l8.062-.812h380.249zm-380.249 401.75h380.249v-264.5H327.937v264.5zm0-304.376h71.813c.444-.972.95-1.957 1.563-2.874l36.5-54.563H327.936v57.437zm119.438 0h99.063c.444-.973.948-1.957 1.562-2.874l36.5-54.563h-98.688l-38.437 57.437zm146.688 0h114.123V338.04H632.5l-38.437 57.437z" },
    { "fill": "#fff", "d": "M452.015 506.408c.02-24.565 26.594-39.967 47.876-27.688l98.562 56.938 3.75 2.5c16.306 12.64 16.292 37.66 0 50.312l-3.75 2.5-98.562 56.94c-21.29 12.282-47.876-3.11-47.876-27.69V506.408zm39.876 100l74.687-43.063-74.687-43.188v86.25z" }
  ]
};

// src/client/file-icon.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var iconFormats = [
  ["png", "png jpg jpeg gif bmp webp ico tiff tif heic image svg"],
  ["vimg", "vimg"],
  ["mindmap", "vboard"],
  ["web", "html htm"],
  ["xsl", "csv xls xlsx"],
  ["md", "md markdown"],
  ["pdf", "pdf"],
  ["ppt", "ppt pptx vppt"],
  ["word", "doc docx text code-preview"],
  ["video", "mp4 webm ogg mov avi wmv flv m3u8 3gp mkv mpg mpeg video"],
  ["audio", "mp3 wav m4a aac flac wma opus audio"],
  ["code", "code js ts jsx tsx py java c cpp cs go rb php swift kt scala rs sh pl lua r dart elm clj erl hs css scss less xml yml yaml json ini toml env sql txt log svelte pug jade ejs hbs njk sass styl dockerfile makefile nginx apache gradle cmake ps1 psm1 bat cmd fish zsh jl ex exs nim cr zig v vb fs ml graphql gql proto rst tex adoc org vue plantuml puml mermaid mmd"],
  ["canvas", "vcanvas"],
  ["vmotion", "vmotion"]
];
var iconsByFormat = new Map(
  iconFormats.flatMap(([icon, formats]) => formats.split(" ").map((format) => [format, icon]))
);
function FileIcon({ format }) {
  const icon = iconsByFormat.get(format.trim().toLowerCase()) ?? "file";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { width: 14, height: 14, viewBox: "0 0 1024 1024", style: { flex: "none" }, "aria-hidden": "true", children: fileIconPaths[icon].map((path, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { ...path }, index)) });
}

// locale/de.json
var de_default = {
  meta: {
    title: "Cheso Design",
    description: "Verwandle deine Ideen, Dateien und Recherchen in beeindruckende Pr\xE4sentationen, Poster, Videos und mehr. Erstelle, bearbeite und teile deine Inhalte mit Cheso.",
    detail: "docs/DETAIL.de.md"
  },
  messages: {
    loginDenied: "Cheso hat die Anmeldung abgelehnt. Rufe einen neuen Autorisierungslink ab und versuche es erneut.",
    loginIncomplete: "Die Anmeldung bei Cheso wurde nicht abgeschlossen. Rufe einen neuen Autorisierungslink ab.",
    task: "Cheso-Aufgabe",
    taskId: "Cheso-Aufgabe {id}",
    artifacts: "Cheso-Ergebnisse",
    preparing: "Wird vorbereitet\u2026",
    generating: "Wird erstellt\u2026",
    toolFailed: "Cheso-Anfrage fehlgeschlagen",
    taskCompleted: "Abgeschlossen \xB7 Dateien: {count}",
    taskRunning: "Wird noch erstellt",
    taskQueued: "In der Warteschlange",
    lowCredits: "Nicht gen\xFCgend Guthaben",
    taskFailed: "Fehlgeschlagen",
    taskStopped: "Abgebrochen",
    taskRolledBack: "Zur\xFCckgesetzt",
    taskNeedsReply: "Wartet auf deine Antwort",
    questionRound: "Fragerunde {number}",
    questionAnswered: "Beantwortet",
    questionSkipped: "\xDCbersprungen",
    taskUnknown: "Unbekannter Status",
    fileList: "Cheso-Dateien",
    resultBadge: "Endergebnis",
    openInCheso: "In Cheso \xF6ffnen",
    editInCheso: "In Cheso bearbeiten",
    open: "\xD6ffnen",
    preview: "Vorschau",
    loginTitle: "Cheso-Anmeldung",
    loginRequired: "Melde dich bei Cheso an, um fortzufahren.",
    loginInstructions: "Erteile den Zugriff in Cheso. Kehre dann hierher zur\xFCck und w\xE4hle \u201EAnmeldung pr\xFCfen\u201C.",
    loginEnterCode: "Gib diesen Code auf der Autorisierungsseite ein:",
    loginAuthorize: "In Cheso autorisieren",
    loginCheck: "Anmeldung pr\xFCfen",
    loginChecking: "Wird gepr\xFCft\u2026",
    loginGetLink: "Autorisierungslink abrufen",
    loginGetNewLink: "Neuen Autorisierungslink abrufen",
    loginGettingLink: "Link wird abgerufen\u2026",
    loginExpired: "Dieser Link ist abgelaufen. Rufe einen neuen Autorisierungslink ab.",
    loginSignedIn: "Du bist bei Cheso angemeldet. Sende deine vorige Anfrage erneut.",
    loginWaiting: "Die Autorisierung steht noch aus. Schlie\xDFe sie in Cheso ab und pr\xFCfe die Anmeldung erneut.",
    loginNotStarted: "Die Anmeldung wurde noch nicht gestartet oder abgebrochen. Rufe einen neuen Autorisierungslink ab.",
    loginFailed: "Die Anmeldung bei Cheso ist fehlgeschlagen. Versuche es erneut.",
    fixedTokenRejected: "Cheso hat den konfigurierten API-Token abgelehnt. Aktualisiere oder entferne ihn in der DSH-Konfiguration oder Startumgebung und starte DSH neu.",
    loginInvalidLink: "Cheso hat keinen g\xFCltigen Autorisierungslink zur\xFCckgegeben.",
    loginUnknownSite: "Diese Cheso-Website ist nicht mehr konfiguriert. Pr\xFCfe die Website-Einstellungen und versuche es erneut.",
    previewTitle: "Cheso-Vorschau",
    previewOpenFailed: "Die Cheso-Vorschau konnte nicht ge\xF6ffnet werden.",
    previewLoginRequired: "Melde dich bei der Cheso-Website an, auf der diese Datei liegt, und \xF6ffne die Vorschau erneut.",
    previewForbidden: "Dein Cheso-Konto hat keinen Zugriff auf diese Datei.",
    previewUnknownSite: "Die Cheso-Website dieser Datei wurde nicht gefunden. Rufe die Projektdateien erneut ab und \xF6ffne dann die Vorschau.",
    previewSessionExpired: "Deine DSH-Sitzung ist abgelaufen. Stelle die Verbindung wieder her und \xF6ffne die Vorschau erneut.",
    previewUrlRequestFailed: "Die Datei-URL konnte nicht abgerufen werden (HTTP {status}).",
    previewInvalidFileUrl: "Die Datei-URL ist ung\xFCltig.",
    previewReopen: "\xD6ffne die Vorschau erneut \xFCber eine Cheso-Ergebniskarte im Chat.",
    previewUnsupported: "Du kannst diese Datei in Cheso \xF6ffnen.",
    previewInvalidEmbedUrl: "Die URL der Cheso-Vorschau ist ung\xFCltig.",
    previewTimedOut: "Die Vorschau konnte nicht geladen werden. W\xE4hle \u201EIn Cheso bearbeiten\u201C.",
    previewLoadFailed: "Die Vorschau konnte nicht geladen werden.",
    previewFileStored: "Die Datei {name} ist weiterhin in Cheso gespeichert. Du kannst sie dort \xF6ffnen.",
    previewLoading: "Cheso-Vorschau wird geladen\u2026",
    settingsSummary: "W\xE4hle eine Cheso-Website.",
    settingsLoading: "Website-Einstellungen werden geladen\u2026",
    settingsUnavailable: "Die Website-Einstellungen sind vor\xFCbergehend nicht verf\xFCgbar.",
    settingsSite: "Cheso-Website",
    settingsConfigured: "Startkonfiguration",
    settingsHelp: "Die gew\xE4hlte Website wird f\xFCr die Anmeldung und neue Projektanfragen verwendet. Jede Website speichert ihren eigenen Anmeldestatus.",
    settingsStartupLocked: "Die Website ist durch die Startkonfiguration festgelegt.",
    settingsPreviewHost: "Vorschauserver: {host}.",
    settingsSaving: "Wird gespeichert\u2026",
    settingsFailed: "Die Website konnte nicht gewechselt werden. Versuche es erneut.",
    accountTitle: "Cheso-Konto",
    accountHint: "Verbinde dein Cheso-Konto, um Ergebnisse im Chat zu erstellen. Jede Cheso-Website speichert ihre eigene Anmeldung.",
    accountSite: "Website: {host}",
    accountChecking: "Anmeldung wird gepr\xFCft\u2026",
    accountSignedIn: "Bei Cheso angemeldet.",
    accountSignedOut: "Auf dieser Cheso-Website nicht angemeldet.",
    accountConnect: "Cheso-Konto verbinden",
    accountStatusFailed: "Die Cheso-Anmeldung konnte nicht gepr\xFCft werden. Versuche es erneut.",
    accountWaiting: "Warten auf die Autorisierung\u2026",
    accountInstructions: "Schlie\xDFe die Autorisierung in Cheso ab und kehre hierher zur\xFCck; die Anmeldung wird automatisch best\xE4tigt."
  }
};

// locale/en.json
var en_default = {
  meta: {
    title: "Cheso Design",
    description: "Turn your ideas, files, and research into stunning presentations, posters, videos, and more. Create, edit, and share with Cheso",
    detail: "docs/DETAIL.md"
  },
  messages: {
    loginDenied: "Cheso denied the sign-in request. Get a new authorization link to try again.",
    loginIncomplete: "Cheso sign-in did not finish. Get a new authorization link.",
    task: "Cheso task",
    taskId: "Cheso task {id}",
    artifacts: "Cheso results",
    preparing: "Preparing\u2026",
    generating: "Generating\u2026",
    toolFailed: "Cheso request failed",
    taskCompleted: "Completed \xB7 Files: {count}",
    taskRunning: "Still generating",
    taskQueued: "Queued",
    lowCredits: "Not enough credits",
    taskFailed: "Failed",
    taskStopped: "Stopped",
    taskRolledBack: "Rolled back",
    taskNeedsReply: "Waiting for your reply",
    questionRound: "Q&A round {number}",
    questionAnswered: "Answered",
    questionSkipped: "Skipped",
    taskUnknown: "Unknown status",
    fileList: "Cheso files",
    resultBadge: "Final result",
    openInCheso: "Open in Cheso",
    editInCheso: "Edit in Cheso",
    open: "Open",
    preview: "Preview",
    loginTitle: "Cheso sign-in",
    loginRequired: "Sign in to Cheso to continue.",
    loginInstructions: "Authorize access in Cheso, then return here and select \u201CCheck sign-in\u201D.",
    loginEnterCode: "Enter this code on the authorization page:",
    loginAuthorize: "Authorize in Cheso",
    loginCheck: "Check sign-in",
    loginChecking: "Checking\u2026",
    loginGetLink: "Get authorization link",
    loginGetNewLink: "Get a new authorization link",
    loginGettingLink: "Getting link\u2026",
    loginExpired: "This link has expired. Get a new authorization link.",
    loginSignedIn: "You\u2019re signed in to Cheso. Send your previous request again.",
    loginWaiting: "Authorization is pending. Finish in Cheso, then check again.",
    loginNotStarted: "Sign-in hasn\u2019t started or was canceled. Get a new authorization link.",
    loginFailed: "Could not sign in to Cheso. Try again.",
    fixedTokenRejected: "Cheso rejected the configured API token. Update or remove it from your DSH configuration or startup environment, then restart DSH.",
    loginInvalidLink: "Cheso did not return a valid authorization link.",
    loginUnknownSite: "This Cheso site is no longer configured. Check the site settings and try again.",
    previewTitle: "Cheso preview",
    previewOpenFailed: "Could not open the Cheso preview.",
    previewLoginRequired: "Sign in to the Cheso site that owns this file, then open the preview again.",
    previewForbidden: "Your Cheso account does not have access to this file.",
    previewUnknownSite: "Could not find the Cheso site for this file. List the project files again before opening the preview.",
    previewSessionExpired: "Your DSH session has expired. Reconnect and open the preview again.",
    previewUrlRequestFailed: "Could not get the file URL (HTTP {status}).",
    previewInvalidFileUrl: "The file URL is invalid.",
    previewReopen: "Reopen the preview from a Cheso result card in the conversation.",
    previewUnsupported: "You can open this file in Cheso.",
    previewInvalidEmbedUrl: "The Cheso preview URL is invalid.",
    previewTimedOut: "The preview didn\u2019t load. Select \u201CEdit in Cheso\u201D.",
    previewLoadFailed: "Could not load the preview.",
    previewFileStored: "{name} is still saved in Cheso. You can open it there.",
    previewLoading: "Loading Cheso preview\u2026",
    settingsSummary: "Choose a Cheso site.",
    settingsLoading: "Loading site settings\u2026",
    settingsUnavailable: "Site settings are temporarily unavailable.",
    settingsSite: "Cheso site",
    settingsConfigured: "Startup configuration",
    settingsHelp: "The selected site handles sign-in and new project requests. Each site keeps its own sign-in state.",
    settingsStartupLocked: "The site is set by the startup configuration.",
    settingsPreviewHost: "Preview host: {host}.",
    settingsSaving: "Saving\u2026",
    settingsFailed: "Could not switch sites. Try again.",
    accountTitle: "Cheso account",
    accountHint: "Connect your Cheso account to create results from chat. Each Cheso site keeps its own sign-in.",
    accountSite: "Site: {host}",
    accountChecking: "Checking sign-in\u2026",
    accountSignedIn: "Signed in to Cheso.",
    accountSignedOut: "Not signed in to this Cheso site.",
    accountConnect: "Connect Cheso account",
    accountStatusFailed: "Could not check the Cheso sign-in. Try again.",
    accountWaiting: "Waiting for authorization\u2026",
    accountInstructions: "Finish in Cheso, then return here; the sign-in is confirmed automatically."
  }
};

// locale/es.json
var es_default = {
  meta: {
    title: "Cheso Design",
    description: "Convierte tus ideas, archivos e investigaciones en impresionantes presentaciones, p\xF3steres, v\xEDdeos y mucho m\xE1s. Crea, edita y comparte con Cheso.",
    detail: "docs/DETAIL.es.md"
  },
  messages: {
    loginDenied: "Cheso rechaz\xF3 la solicitud de inicio de sesi\xF3n. Obt\xE9n un nuevo enlace de autorizaci\xF3n e int\xE9ntalo de nuevo.",
    loginIncomplete: "El inicio de sesi\xF3n en Cheso no se complet\xF3. Obt\xE9n un nuevo enlace de autorizaci\xF3n.",
    task: "Tarea de Cheso",
    taskId: "Tarea de Cheso {id}",
    artifacts: "Resultados de Cheso",
    preparing: "Preparando\u2026",
    generating: "Generando\u2026",
    toolFailed: "Error en la solicitud a Cheso",
    taskCompleted: "Completado \xB7 Archivos: {count}",
    taskRunning: "Generaci\xF3n en curso",
    taskQueued: "En cola",
    lowCredits: "Cr\xE9ditos insuficientes",
    taskFailed: "Error",
    taskStopped: "Detenido",
    taskRolledBack: "Cambios revertidos",
    taskNeedsReply: "En espera de tu respuesta",
    questionRound: "Ronda de preguntas {number}",
    questionAnswered: "Respondido",
    questionSkipped: "Omitido",
    taskUnknown: "Estado desconocido",
    fileList: "Archivos de Cheso",
    resultBadge: "Resultado final",
    openInCheso: "Abrir en Cheso",
    editInCheso: "Editar en Cheso",
    open: "Abrir",
    preview: "Vista previa",
    loginTitle: "Inicio de sesi\xF3n en Cheso",
    loginRequired: "Inicia sesi\xF3n en Cheso para continuar.",
    loginInstructions: "Autoriza el acceso en Cheso, vuelve aqu\xED y selecciona \xABComprobar inicio de sesi\xF3n\xBB.",
    loginEnterCode: "Introduce este c\xF3digo en la p\xE1gina de autorizaci\xF3n:",
    loginAuthorize: "Autorizar en Cheso",
    loginCheck: "Comprobar inicio de sesi\xF3n",
    loginChecking: "Comprobando\u2026",
    loginGetLink: "Obtener enlace de autorizaci\xF3n",
    loginGetNewLink: "Obtener un nuevo enlace de autorizaci\xF3n",
    loginGettingLink: "Obteniendo enlace\u2026",
    loginExpired: "El enlace ha caducado. Obt\xE9n un nuevo enlace de autorizaci\xF3n.",
    loginSignedIn: "Has iniciado sesi\xF3n en Cheso. Vuelve a enviar tu solicitud anterior.",
    loginWaiting: "La autorizaci\xF3n est\xE1 pendiente. Compl\xE9tala en Cheso y vuelve a comprobarla.",
    loginNotStarted: "El inicio de sesi\xF3n no se ha iniciado o se cancel\xF3. Obt\xE9n un nuevo enlace de autorizaci\xF3n.",
    loginFailed: "No se pudo iniciar sesi\xF3n en Cheso. Int\xE9ntalo de nuevo.",
    fixedTokenRejected: "Cheso rechaz\xF3 el token de API configurado. Actual\xEDzalo o elim\xEDnalo en la configuraci\xF3n o el entorno de inicio de DSH y reinicia DSH.",
    loginInvalidLink: "Cheso no devolvi\xF3 un enlace de autorizaci\xF3n v\xE1lido.",
    loginUnknownSite: "Este sitio de Cheso ya no est\xE1 configurado. Revisa los ajustes del sitio e int\xE9ntalo de nuevo.",
    previewTitle: "Vista previa de Cheso",
    previewOpenFailed: "No se pudo abrir la vista previa de Cheso.",
    previewLoginRequired: "Inicia sesi\xF3n en el sitio de Cheso donde est\xE1 el archivo y vuelve a abrir la vista previa.",
    previewForbidden: "Tu cuenta de Cheso no tiene acceso a este archivo.",
    previewUnknownSite: "No se encontr\xF3 el sitio de Cheso de este archivo. Vuelve a consultar los archivos del proyecto antes de abrir la vista previa.",
    previewSessionExpired: "Tu sesi\xF3n de DSH ha caducado. Vuelve a conectarte y abre otra vez la vista previa.",
    previewUrlRequestFailed: "No se pudo obtener la URL del archivo (HTTP {status}).",
    previewInvalidFileUrl: "La URL del archivo no es v\xE1lida.",
    previewReopen: "Vuelve a abrir la vista previa desde una tarjeta de resultados de Cheso en la conversaci\xF3n.",
    previewUnsupported: "Puedes abrir este archivo en Cheso.",
    previewInvalidEmbedUrl: "La URL de la vista previa de Cheso no es v\xE1lida.",
    previewTimedOut: "No se carg\xF3 la vista previa. Selecciona \xABEditar en Cheso\xBB.",
    previewLoadFailed: "No se pudo cargar la vista previa.",
    previewFileStored: "{name} sigue guardado en Cheso. Puedes abrirlo all\xED.",
    previewLoading: "Cargando vista previa de Cheso\u2026",
    settingsSummary: "Elige un sitio de Cheso.",
    settingsLoading: "Cargando los ajustes del sitio\u2026",
    settingsUnavailable: "Los ajustes del sitio no est\xE1n disponibles temporalmente.",
    settingsSite: "Sitio de Cheso",
    settingsConfigured: "Configuraci\xF3n de inicio",
    settingsHelp: "El sitio seleccionado se usa para iniciar sesi\xF3n y solicitar nuevos proyectos. Cada sitio mantiene su propia sesi\xF3n.",
    settingsStartupLocked: "La configuraci\xF3n de inicio fija el sitio.",
    settingsPreviewHost: "Servidor de vistas previas: {host}.",
    settingsSaving: "Guardando\u2026",
    settingsFailed: "No se pudo cambiar de sitio. Int\xE9ntalo de nuevo.",
    accountTitle: "Cuenta de Cheso",
    accountHint: "Conecta tu cuenta de Cheso para crear resultados desde el chat. Cada sitio de Cheso guarda su propio inicio de sesi\xF3n.",
    accountSite: "Sitio: {host}",
    accountChecking: "Comprobando el inicio de sesi\xF3n\u2026",
    accountSignedIn: "Has iniciado sesi\xF3n en Cheso.",
    accountSignedOut: "No has iniciado sesi\xF3n en este sitio de Cheso.",
    accountConnect: "Conectar cuenta de Cheso",
    accountStatusFailed: "No se pudo comprobar el inicio de sesi\xF3n en Cheso. Int\xE9ntalo de nuevo.",
    accountWaiting: "Esperando la autorizaci\xF3n\u2026",
    accountInstructions: "Completa la autorizaci\xF3n en Cheso y vuelve aqu\xED; el inicio de sesi\xF3n se confirmar\xE1 autom\xE1ticamente."
  }
};

// locale/fr.json
var fr_default = {
  meta: {
    title: "Cheso Design",
    description: "Transformez vos id\xE9es, vos fichiers et vos recherches en pr\xE9sentations, affiches, vid\xE9os et autres cr\xE9ations qui marquent les esprits. Cr\xE9ez, modifiez et partagez avec Cheso.",
    detail: "docs/DETAIL.fr.md"
  },
  messages: {
    loginDenied: "Cheso a refus\xE9 la demande de connexion. Obtenez un nouveau lien d\u2019autorisation pour r\xE9essayer.",
    loginIncomplete: "La connexion \xE0 Cheso n\u2019a pas abouti. Obtenez un nouveau lien d\u2019autorisation.",
    task: "T\xE2che Cheso",
    taskId: "T\xE2che Cheso {id}",
    artifacts: "R\xE9sultats Cheso",
    preparing: "Pr\xE9paration\u2026",
    generating: "G\xE9n\xE9ration\u2026",
    toolFailed: "\xC9chec de la requ\xEAte Cheso",
    taskCompleted: "Termin\xE9 \xB7 Fichiers : {count}",
    taskRunning: "G\xE9n\xE9ration en cours",
    taskQueued: "En file d\u2019attente",
    lowCredits: "Cr\xE9dits insuffisants",
    taskFailed: "\xC9chec",
    taskStopped: "Arr\xEAt\xE9",
    taskRolledBack: "Modifications annul\xE9es",
    taskNeedsReply: "En attente de votre r\xE9ponse",
    questionRound: "S\xE9rie de questions {number}",
    questionAnswered: "R\xE9pondu",
    questionSkipped: "Ignor\xE9",
    taskUnknown: "\xC9tat inconnu",
    fileList: "Fichiers Cheso",
    resultBadge: "R\xE9sultat final",
    openInCheso: "Ouvrir dans Cheso",
    editInCheso: "Modifier dans Cheso",
    open: "Ouvrir",
    preview: "Aper\xE7u",
    loginTitle: "Connexion \xE0 Cheso",
    loginRequired: "Connectez-vous \xE0 Cheso pour continuer.",
    loginInstructions: "Autorisez l\u2019acc\xE8s dans Cheso, puis revenez ici et s\xE9lectionnez \xAB V\xE9rifier la connexion \xBB.",
    loginEnterCode: "Saisissez ce code sur la page d\u2019autorisation :",
    loginAuthorize: "Autoriser dans Cheso",
    loginCheck: "V\xE9rifier la connexion",
    loginChecking: "V\xE9rification\u2026",
    loginGetLink: "Obtenir le lien d\u2019autorisation",
    loginGetNewLink: "Obtenir un nouveau lien d\u2019autorisation",
    loginGettingLink: "R\xE9cup\xE9ration du lien\u2026",
    loginExpired: "Ce lien a expir\xE9. Obtenez un nouveau lien d\u2019autorisation.",
    loginSignedIn: "Vous \xEAtes connect\xE9 \xE0 Cheso. Renvoyez votre demande pr\xE9c\xE9dente.",
    loginWaiting: "L\u2019autorisation est en attente. Terminez-la dans Cheso, puis v\xE9rifiez \xE0 nouveau.",
    loginNotStarted: "La connexion n\u2019a pas d\xE9marr\xE9 ou a \xE9t\xE9 annul\xE9e. Obtenez un nouveau lien d\u2019autorisation.",
    loginFailed: "Impossible de se connecter \xE0 Cheso. R\xE9essayez.",
    fixedTokenRejected: "Cheso a refus\xE9 le jeton API configur\xE9. Mettez-le \xE0 jour ou supprimez-le dans la configuration ou l\u2019environnement de d\xE9marrage de DSH, puis red\xE9marrez DSH.",
    loginInvalidLink: "Cheso n\u2019a pas renvoy\xE9 de lien d\u2019autorisation valide.",
    loginUnknownSite: "Ce site Cheso n\u2019est plus configur\xE9. V\xE9rifiez les param\xE8tres du site et r\xE9essayez.",
    previewTitle: "Aper\xE7u Cheso",
    previewOpenFailed: "Impossible d\u2019ouvrir l\u2019aper\xE7u Cheso.",
    previewLoginRequired: "Connectez-vous au site Cheso qui h\xE9berge ce fichier, puis rouvrez l\u2019aper\xE7u.",
    previewForbidden: "Votre compte Cheso n\u2019a pas acc\xE8s \xE0 ce fichier.",
    previewUnknownSite: "Impossible de trouver le site Cheso de ce fichier. Consultez \xE0 nouveau les fichiers du projet avant d\u2019ouvrir l\u2019aper\xE7u.",
    previewSessionExpired: "Votre session DSH a expir\xE9. Reconnectez-vous et rouvrez l\u2019aper\xE7u.",
    previewUrlRequestFailed: "Impossible de r\xE9cup\xE9rer l\u2019URL du fichier (HTTP {status}).",
    previewInvalidFileUrl: "L\u2019URL du fichier n\u2019est pas valide.",
    previewReopen: "Rouvrez l\u2019aper\xE7u depuis une carte de r\xE9sultats Cheso dans la conversation.",
    previewUnsupported: "Vous pouvez ouvrir ce fichier dans Cheso.",
    previewInvalidEmbedUrl: "L\u2019URL de l\u2019aper\xE7u Cheso n\u2019est pas valide.",
    previewTimedOut: "L\u2019aper\xE7u n\u2019a pas pu se charger. S\xE9lectionnez \xAB Modifier dans Cheso \xBB.",
    previewLoadFailed: "Impossible de charger l\u2019aper\xE7u.",
    previewFileStored: "Le fichier {name} est toujours enregistr\xE9 dans Cheso. Vous pouvez l\u2019y ouvrir.",
    previewLoading: "Chargement de l\u2019aper\xE7u Cheso\u2026",
    settingsSummary: "Choisissez un site Cheso.",
    settingsLoading: "Chargement des param\xE8tres du site\u2026",
    settingsUnavailable: "Les param\xE8tres du site sont temporairement indisponibles.",
    settingsSite: "Site Cheso",
    settingsConfigured: "Configuration de d\xE9marrage",
    settingsHelp: "Le site s\xE9lectionn\xE9 g\xE8re la connexion et les demandes de nouveaux projets. Chaque site conserve son propre \xE9tat de connexion.",
    settingsStartupLocked: "La configuration de d\xE9marrage fixe le site.",
    settingsPreviewHost: "Serveur d\u2019aper\xE7u : {host}.",
    settingsSaving: "Enregistrement\u2026",
    settingsFailed: "Impossible de changer de site. R\xE9essayez.",
    accountTitle: "Compte Cheso",
    accountHint: "Connectez votre compte Cheso pour cr\xE9er des r\xE9sultats depuis le chat. Chaque site Cheso conserve sa propre connexion.",
    accountSite: "Site : {host}",
    accountChecking: "V\xE9rification de la connexion\u2026",
    accountSignedIn: "Vous \xEAtes connect\xE9 \xE0 Cheso.",
    accountSignedOut: "Vous n\u2019\xEAtes pas connect\xE9 \xE0 ce site Cheso.",
    accountConnect: "Connecter le compte Cheso",
    accountStatusFailed: "Impossible de v\xE9rifier la connexion \xE0 Cheso. R\xE9essayez.",
    accountWaiting: "En attente de l\u2019autorisation\u2026",
    accountInstructions: "Terminez l\u2019autorisation dans Cheso, puis revenez ici ; la connexion sera confirm\xE9e automatiquement."
  }
};

// locale/ja.json
var ja_default = {
  meta: {
    title: "Cheso Design",
    description: "\u30A2\u30A4\u30C7\u30A2\u3084\u30D5\u30A1\u30A4\u30EB\u3001\u8ABF\u67FB\u8CC7\u6599\u3092\u3001\u9B45\u529B\u7684\u306A\u30D7\u30EC\u30BC\u30F3\u30C6\u30FC\u30B7\u30E7\u30F3\u3084\u30DD\u30B9\u30BF\u30FC\u3001\u52D5\u753B\u306A\u3069\u306B\u3002Cheso \u3067\u4F5C\u6210\u3001\u7DE8\u96C6\u3001\u5171\u6709\u3067\u304D\u307E\u3059\u3002",
    detail: "docs/DETAIL.ja.md"
  },
  messages: {
    loginDenied: "Cheso \u3078\u306E\u30ED\u30B0\u30A4\u30F3\u304C\u62D2\u5426\u3055\u308C\u307E\u3057\u305F\u3002\u65B0\u3057\u3044\u8A8D\u8A3C\u30EA\u30F3\u30AF\u3092\u53D6\u5F97\u3057\u3066\u3001\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002",
    loginIncomplete: "Cheso \u3078\u306E\u30ED\u30B0\u30A4\u30F3\u304C\u5B8C\u4E86\u3057\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u65B0\u3057\u3044\u8A8D\u8A3C\u30EA\u30F3\u30AF\u3092\u53D6\u5F97\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    task: "Cheso \u30BF\u30B9\u30AF",
    taskId: "Cheso \u30BF\u30B9\u30AF {id}",
    artifacts: "Cheso \u306E\u6210\u679C\u7269",
    preparing: "\u6E96\u5099\u4E2D\u2026",
    generating: "\u751F\u6210\u4E2D\u2026",
    toolFailed: "Cheso \u3078\u306E\u30EA\u30AF\u30A8\u30B9\u30C8\u306B\u5931\u6557\u3057\u307E\u3057\u305F",
    taskCompleted: "\u5B8C\u4E86 \xB7 \u30D5\u30A1\u30A4\u30EB {count} \u4EF6",
    taskRunning: "\u751F\u6210\u3092\u7D9A\u3051\u3066\u3044\u307E\u3059",
    taskQueued: "\u9001\u4FE1\u5F85\u3061",
    lowCredits: "\u30AF\u30EC\u30B8\u30C3\u30C8\u4E0D\u8DB3",
    taskFailed: "\u5931\u6557",
    taskStopped: "\u4E2D\u6B62",
    taskRolledBack: "\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u6E08\u307F",
    taskNeedsReply: "\u8FD4\u4FE1\u5F85\u3061",
    questionRound: "\u8CEA\u7591\u5FDC\u7B54 {number} \u56DE\u76EE",
    questionAnswered: "\u56DE\u7B54\u6E08\u307F",
    questionSkipped: "\u30B9\u30AD\u30C3\u30D7\u6E08\u307F",
    taskUnknown: "\u72B6\u614B\u4E0D\u660E",
    fileList: "Cheso \u306E\u30D5\u30A1\u30A4\u30EB\u4E00\u89A7",
    resultBadge: "\u6700\u7D42\u6210\u679C\u7269",
    openInCheso: "Cheso \u3067\u958B\u304F",
    editInCheso: "Cheso \u3067\u7DE8\u96C6",
    open: "\u958B\u304F",
    preview: "\u30D7\u30EC\u30D3\u30E5\u30FC",
    loginTitle: "Cheso \u306B\u30ED\u30B0\u30A4\u30F3",
    loginRequired: "\u7D9A\u3051\u308B\u306B\u306F Cheso \u306B\u30ED\u30B0\u30A4\u30F3\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    loginInstructions: "Cheso \u3067\u30A2\u30AF\u30BB\u30B9\u3092\u627F\u8A8D\u3057\u305F\u3089\u3001\u3053\u3053\u306B\u623B\u3063\u3066\u300C\u30ED\u30B0\u30A4\u30F3\u3092\u78BA\u8A8D\u300D\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044\u3002",
    loginEnterCode: "\u8A8D\u8A3C\u30DA\u30FC\u30B8\u3067\u5165\u529B\u3059\u308B\u30B3\u30FC\u30C9\uFF1A",
    loginAuthorize: "Cheso \u3067\u627F\u8A8D",
    loginCheck: "\u30ED\u30B0\u30A4\u30F3\u3092\u78BA\u8A8D",
    loginChecking: "\u78BA\u8A8D\u4E2D\u2026",
    loginGetLink: "\u8A8D\u8A3C\u30EA\u30F3\u30AF\u3092\u53D6\u5F97",
    loginGetNewLink: "\u65B0\u3057\u3044\u8A8D\u8A3C\u30EA\u30F3\u30AF\u3092\u53D6\u5F97",
    loginGettingLink: "\u30EA\u30F3\u30AF\u3092\u53D6\u5F97\u4E2D\u2026",
    loginExpired: "\u3053\u306E\u30EA\u30F3\u30AF\u306F\u671F\u9650\u5207\u308C\u3067\u3059\u3002\u65B0\u3057\u3044\u8A8D\u8A3C\u30EA\u30F3\u30AF\u3092\u53D6\u5F97\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    loginSignedIn: "Cheso \u306B\u30ED\u30B0\u30A4\u30F3\u3057\u307E\u3057\u305F\u3002\u5148\u307B\u3069\u306E\u30EA\u30AF\u30A8\u30B9\u30C8\u3092\u3082\u3046\u4E00\u5EA6\u9001\u4FE1\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    loginWaiting: "\u627F\u8A8D\u5F85\u3061\u3067\u3059\u3002Cheso \u3067\u624B\u7D9A\u304D\u3092\u5B8C\u4E86\u3057\u3066\u304B\u3089\u3001\u3082\u3046\u4E00\u5EA6\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    loginNotStarted: "\u30ED\u30B0\u30A4\u30F3\u304C\u958B\u59CB\u3055\u308C\u3066\u3044\u306A\u3044\u304B\u3001\u30AD\u30E3\u30F3\u30BB\u30EB\u3055\u308C\u307E\u3057\u305F\u3002\u65B0\u3057\u3044\u8A8D\u8A3C\u30EA\u30F3\u30AF\u3092\u53D6\u5F97\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    loginFailed: "Cheso \u306B\u30ED\u30B0\u30A4\u30F3\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002",
    fixedTokenRejected: "Cheso \u304C\u8A2D\u5B9A\u6E08\u307F\u306E API \u30C8\u30FC\u30AF\u30F3\u3092\u62D2\u5426\u3057\u307E\u3057\u305F\u3002DSH \u306E\u8A2D\u5B9A\u307E\u305F\u306F\u8D77\u52D5\u74B0\u5883\u3067\u30C8\u30FC\u30AF\u30F3\u3092\u66F4\u65B0\u307E\u305F\u306F\u524A\u9664\u3057\u3001DSH \u3092\u518D\u8D77\u52D5\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    loginInvalidLink: "Cheso \u304B\u3089\u6709\u52B9\u306A\u8A8D\u8A3C\u30EA\u30F3\u30AF\u304C\u8FD4\u3055\u308C\u307E\u305B\u3093\u3067\u3057\u305F\u3002",
    loginUnknownSite: "\u3053\u306E Cheso \u30B5\u30A4\u30C8\u306F\u73FE\u5728\u306E\u8A2D\u5B9A\u306B\u3042\u308A\u307E\u305B\u3093\u3002\u30B5\u30A4\u30C8\u8A2D\u5B9A\u3092\u78BA\u8A8D\u3057\u3066\u3001\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002",
    previewTitle: "Cheso \u30D7\u30EC\u30D3\u30E5\u30FC",
    previewOpenFailed: "Cheso \u30D7\u30EC\u30D3\u30E5\u30FC\u3092\u958B\u3051\u307E\u305B\u3093\u3067\u3057\u305F\u3002",
    previewLoginRequired: "\u3053\u306E\u30D5\u30A1\u30A4\u30EB\u304C\u3042\u308B Cheso \u30B5\u30A4\u30C8\u306B\u30ED\u30B0\u30A4\u30F3\u3057\u3066\u304B\u3089\u3001\u30D7\u30EC\u30D3\u30E5\u30FC\u3092\u958B\u304D\u76F4\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    previewForbidden: "\u73FE\u5728\u306E Cheso \u30A2\u30AB\u30A6\u30F3\u30C8\u3067\u306F\u3053\u306E\u30D5\u30A1\u30A4\u30EB\u306B\u30A2\u30AF\u30BB\u30B9\u3067\u304D\u307E\u305B\u3093\u3002",
    previewUnknownSite: "\u3053\u306E\u30D5\u30A1\u30A4\u30EB\u306E Cheso \u30B5\u30A4\u30C8\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30D5\u30A1\u30A4\u30EB\u4E00\u89A7\u3092\u53D6\u5F97\u3057\u76F4\u3057\u3066\u304B\u3089\u3001\u30D7\u30EC\u30D3\u30E5\u30FC\u3092\u958B\u3044\u3066\u304F\u3060\u3055\u3044\u3002",
    previewSessionExpired: "DSH \u30BB\u30C3\u30B7\u30E7\u30F3\u306E\u6709\u52B9\u671F\u9650\u304C\u5207\u308C\u307E\u3057\u305F\u3002\u518D\u63A5\u7D9A\u3057\u3066\u30D7\u30EC\u30D3\u30E5\u30FC\u3092\u958B\u304D\u76F4\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    previewUrlRequestFailed: "\u30D5\u30A1\u30A4\u30EB\u306E URL \u3092\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\uFF08HTTP {status}\uFF09\u3002",
    previewInvalidFileUrl: "\u30D5\u30A1\u30A4\u30EB\u306E URL \u304C\u7121\u52B9\u3067\u3059\u3002",
    previewReopen: "\u4F1A\u8A71\u5185\u306E Cheso \u6210\u679C\u7269\u30AB\u30FC\u30C9\u304B\u3089\u30D7\u30EC\u30D3\u30E5\u30FC\u3092\u958B\u304D\u76F4\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    previewUnsupported: "\u3053\u306E\u30D5\u30A1\u30A4\u30EB\u306F Cheso \u3067\u958B\u3051\u307E\u3059\u3002",
    previewInvalidEmbedUrl: "Cheso \u30D7\u30EC\u30D3\u30E5\u30FC\u306E URL \u304C\u7121\u52B9\u3067\u3059\u3002",
    previewTimedOut: "\u30D7\u30EC\u30D3\u30E5\u30FC\u3092\u8AAD\u307F\u8FBC\u3081\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u300CCheso \u3067\u7DE8\u96C6\u300D\u3092\u9078\u3093\u3067\u304F\u3060\u3055\u3044\u3002",
    previewLoadFailed: "\u30D7\u30EC\u30D3\u30E5\u30FC\u3092\u8AAD\u307F\u8FBC\u3081\u307E\u305B\u3093\u3067\u3057\u305F\u3002",
    previewFileStored: "{name} \u306F Cheso \u306B\u4FDD\u5B58\u3055\u308C\u3066\u3044\u307E\u3059\u3002Cheso \u3067\u958B\u3051\u307E\u3059\u3002",
    previewLoading: "Cheso \u30D7\u30EC\u30D3\u30E5\u30FC\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026",
    settingsSummary: "Cheso \u306E\u30B5\u30A4\u30C8\u3092\u9078\u629E\u3057\u307E\u3059\u3002",
    settingsLoading: "\u30B5\u30A4\u30C8\u8A2D\u5B9A\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026",
    settingsUnavailable: "\u73FE\u5728\u3001\u30B5\u30A4\u30C8\u8A2D\u5B9A\u3092\u8AAD\u307F\u8FBC\u3081\u307E\u305B\u3093\u3002",
    settingsSite: "Cheso \u30B5\u30A4\u30C8",
    settingsConfigured: "\u8D77\u52D5\u6642\u306E\u8A2D\u5B9A",
    settingsHelp: "\u30ED\u30B0\u30A4\u30F3\u3068\u65B0\u898F\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u30EA\u30AF\u30A8\u30B9\u30C8\u306B\u306F\u3001\u9078\u629E\u3057\u305F\u30B5\u30A4\u30C8\u3092\u4F7F\u3044\u307E\u3059\u3002\u30ED\u30B0\u30A4\u30F3\u72B6\u614B\u306F\u30B5\u30A4\u30C8\u3054\u3068\u306B\u4FDD\u5B58\u3055\u308C\u307E\u3059\u3002",
    settingsStartupLocked: "\u30B5\u30A4\u30C8\u306F\u8D77\u52D5\u6642\u306E\u8A2D\u5B9A\u3067\u56FA\u5B9A\u3055\u308C\u3066\u3044\u307E\u3059\u3002",
    settingsPreviewHost: "\u30D7\u30EC\u30D3\u30E5\u30FC\u306E\u30DB\u30B9\u30C8\uFF1A{host}\u3002",
    settingsSaving: "\u4FDD\u5B58\u4E2D\u2026",
    settingsFailed: "\u30B5\u30A4\u30C8\u3092\u5207\u308A\u66FF\u3048\u3089\u308C\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002",
    accountTitle: "Cheso \u30A2\u30AB\u30A6\u30F3\u30C8",
    accountHint: "Cheso \u30A2\u30AB\u30A6\u30F3\u30C8\u3092\u63A5\u7D9A\u3059\u308B\u3068\u3001\u30C1\u30E3\u30C3\u30C8\u304B\u3089\u6210\u679C\u7269\u3092\u4F5C\u6210\u3067\u304D\u307E\u3059\u3002\u30ED\u30B0\u30A4\u30F3\u72B6\u614B\u306F\u30B5\u30A4\u30C8\u3054\u3068\u306B\u4FDD\u5B58\u3055\u308C\u307E\u3059\u3002",
    accountSite: "\u30B5\u30A4\u30C8\uFF1A{host}",
    accountChecking: "\u30ED\u30B0\u30A4\u30F3\u72B6\u614B\u3092\u78BA\u8A8D\u4E2D\u2026",
    accountSignedIn: "Cheso \u306B\u30ED\u30B0\u30A4\u30F3\u6E08\u307F\u3067\u3059\u3002",
    accountSignedOut: "\u3053\u306E Cheso \u30B5\u30A4\u30C8\u306B\u306F\u307E\u3060\u30ED\u30B0\u30A4\u30F3\u3057\u3066\u3044\u307E\u305B\u3093\u3002",
    accountConnect: "Cheso \u30A2\u30AB\u30A6\u30F3\u30C8\u3092\u63A5\u7D9A",
    accountStatusFailed: "Cheso \u306E\u30ED\u30B0\u30A4\u30F3\u72B6\u614B\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002",
    accountWaiting: "\u30D6\u30E9\u30A6\u30B6\u3067\u306E\u8A8D\u8A3C\u3092\u5F85\u3063\u3066\u3044\u307E\u3059\u2026",
    accountInstructions: "Cheso \u3067\u8A8D\u8A3C\u3092\u5B8C\u4E86\u3057\u3066\u304B\u3089\u3053\u3053\u306B\u623B\u3063\u3066\u304F\u3060\u3055\u3044\u3002\u30ED\u30B0\u30A4\u30F3\u72B6\u614B\u306F\u81EA\u52D5\u7684\u306B\u78BA\u8A8D\u3055\u308C\u307E\u3059\u3002"
  }
};

// locale/pt.json
var pt_default = {
  meta: {
    title: "Cheso Design",
    description: "Transforme suas ideias, arquivos e pesquisas em apresenta\xE7\xF5es, p\xF4steres, v\xEDdeos e outras cria\xE7\xF5es de impacto. Crie, edite e compartilhe com o Cheso.",
    detail: "docs/DETAIL.pt.md"
  },
  messages: {
    loginDenied: "O Cheso recusou a solicita\xE7\xE3o de login. Obtenha um novo link de autoriza\xE7\xE3o para tentar novamente.",
    loginIncomplete: "O login no Cheso n\xE3o foi conclu\xEDdo. Obtenha um novo link de autoriza\xE7\xE3o.",
    task: "Tarefa do Cheso",
    taskId: "Tarefa do Cheso {id}",
    artifacts: "Resultados do Cheso",
    preparing: "Preparando\u2026",
    generating: "Gerando\u2026",
    toolFailed: "Falha na solicita\xE7\xE3o ao Cheso",
    taskCompleted: "Conclu\xEDdo \xB7 Arquivos: {count}",
    taskRunning: "Gera\xE7\xE3o em andamento",
    taskQueued: "Na fila",
    lowCredits: "Cr\xE9ditos insuficientes",
    taskFailed: "Falha",
    taskStopped: "Interrompido",
    taskRolledBack: "Altera\xE7\xF5es revertidas",
    taskNeedsReply: "Aguardando sua resposta",
    questionRound: "Rodada de perguntas {number}",
    questionAnswered: "Respondido",
    questionSkipped: "Ignorado",
    taskUnknown: "Status desconhecido",
    fileList: "Arquivos do Cheso",
    resultBadge: "Resultado final",
    openInCheso: "Abrir no Cheso",
    editInCheso: "Editar no Cheso",
    open: "Abrir",
    preview: "Pr\xE9via",
    loginTitle: "Login no Cheso",
    loginRequired: "Entre no Cheso para continuar.",
    loginInstructions: "Autorize o acesso no Cheso, volte aqui e selecione \u201CVerificar login\u201D.",
    loginEnterCode: "Digite este c\xF3digo na p\xE1gina de autoriza\xE7\xE3o:",
    loginAuthorize: "Autorizar no Cheso",
    loginCheck: "Verificar login",
    loginChecking: "Verificando\u2026",
    loginGetLink: "Obter link de autoriza\xE7\xE3o",
    loginGetNewLink: "Obter novo link de autoriza\xE7\xE3o",
    loginGettingLink: "Obtendo link\u2026",
    loginExpired: "O link expirou. Obtenha um novo link de autoriza\xE7\xE3o.",
    loginSignedIn: "Voc\xEA entrou no Cheso. Envie sua solicita\xE7\xE3o anterior novamente.",
    loginWaiting: "A autoriza\xE7\xE3o est\xE1 pendente. Conclua no Cheso e verifique novamente.",
    loginNotStarted: "O login n\xE3o foi iniciado ou foi cancelado. Obtenha um novo link de autoriza\xE7\xE3o.",
    loginFailed: "N\xE3o foi poss\xEDvel entrar no Cheso. Tente novamente.",
    fixedTokenRejected: "O Cheso rejeitou o token de API configurado. Atualize ou remova o token na configura\xE7\xE3o ou no ambiente de inicializa\xE7\xE3o do DSH e reinicie o DSH.",
    loginInvalidLink: "O Cheso n\xE3o retornou um link de autoriza\xE7\xE3o v\xE1lido.",
    loginUnknownSite: "Este site do Cheso n\xE3o est\xE1 mais configurado. Verifique as configura\xE7\xF5es do site e tente novamente.",
    previewTitle: "Pr\xE9via do Cheso",
    previewOpenFailed: "N\xE3o foi poss\xEDvel abrir a pr\xE9via do Cheso.",
    previewLoginRequired: "Entre no site do Cheso onde o arquivo est\xE1 salvo e abra a pr\xE9via novamente.",
    previewForbidden: "Sua conta do Cheso n\xE3o tem acesso a este arquivo.",
    previewUnknownSite: "N\xE3o foi poss\xEDvel encontrar o site do Cheso deste arquivo. Consulte os arquivos do projeto novamente antes de abrir a pr\xE9via.",
    previewSessionExpired: "Sua sess\xE3o do DSH expirou. Reconecte-se e abra a pr\xE9via novamente.",
    previewUrlRequestFailed: "N\xE3o foi poss\xEDvel obter a URL do arquivo (HTTP {status}).",
    previewInvalidFileUrl: "A URL do arquivo \xE9 inv\xE1lida.",
    previewReopen: "Abra a pr\xE9via novamente pelo cart\xE3o de resultados do Cheso na conversa.",
    previewUnsupported: "Voc\xEA pode abrir este arquivo no Cheso.",
    previewInvalidEmbedUrl: "A URL da pr\xE9via do Cheso \xE9 inv\xE1lida.",
    previewTimedOut: "A pr\xE9via n\xE3o carregou. Selecione \u201CEditar no Cheso\u201D.",
    previewLoadFailed: "N\xE3o foi poss\xEDvel carregar a pr\xE9via.",
    previewFileStored: "O arquivo {name} continua salvo no Cheso. Voc\xEA pode abri-lo l\xE1.",
    previewLoading: "Carregando pr\xE9via do Cheso\u2026",
    settingsSummary: "Escolha um site do Cheso.",
    settingsLoading: "Carregando as configura\xE7\xF5es do site\u2026",
    settingsUnavailable: "As configura\xE7\xF5es do site est\xE3o temporariamente indispon\xEDveis.",
    settingsSite: "Site do Cheso",
    settingsConfigured: "Configura\xE7\xE3o de inicializa\xE7\xE3o",
    settingsHelp: "O site selecionado \xE9 usado para login e solicita\xE7\xF5es de novos projetos. Cada site mant\xE9m sua pr\xF3pria sess\xE3o.",
    settingsStartupLocked: "O site \xE9 definido pela configura\xE7\xE3o de inicializa\xE7\xE3o.",
    settingsPreviewHost: "Servidor da pr\xE9via: {host}.",
    settingsSaving: "Salvando\u2026",
    settingsFailed: "N\xE3o foi poss\xEDvel trocar de site. Tente novamente.",
    accountTitle: "Conta do Cheso",
    accountHint: "Conecte sua conta do Cheso para criar resultados no chat. Cada site do Cheso mant\xE9m seu pr\xF3prio login.",
    accountSite: "Site: {host}",
    accountChecking: "Verificando o login\u2026",
    accountSignedIn: "Login realizado no Cheso.",
    accountSignedOut: "Voc\xEA n\xE3o est\xE1 conectado a este site do Cheso.",
    accountConnect: "Conectar conta do Cheso",
    accountStatusFailed: "N\xE3o foi poss\xEDvel verificar o login no Cheso. Tente novamente.",
    accountWaiting: "Aguardando a autoriza\xE7\xE3o\u2026",
    accountInstructions: "Conclua a autoriza\xE7\xE3o no Cheso e volte aqui; o login ser\xE1 confirmado automaticamente."
  }
};

// locale/ru.json
var ru_default = {
  meta: {
    title: "Cheso Design",
    description: "\u041F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u0439\u0442\u0435 \u0438\u0434\u0435\u0438, \u0444\u0430\u0439\u043B\u044B \u0438 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u044B \u0438\u0441\u0441\u043B\u0435\u0434\u043E\u0432\u0430\u043D\u0438\u0439 \u0432 \u044D\u0444\u0444\u0435\u043A\u0442\u043D\u044B\u0435 \u043F\u0440\u0435\u0437\u0435\u043D\u0442\u0430\u0446\u0438\u0438, \u043F\u043E\u0441\u0442\u0435\u0440\u044B, \u0432\u0438\u0434\u0435\u043E \u0438 \u043C\u043D\u043E\u0433\u043E\u0435 \u0434\u0440\u0443\u0433\u043E\u0435. \u0421\u043E\u0437\u0434\u0430\u0432\u0430\u0439\u0442\u0435, \u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u0443\u0439\u0442\u0435 \u0438 \u0434\u0435\u043B\u0438\u0442\u0435\u0441\u044C \u0440\u0430\u0431\u043E\u0442\u0430\u043C\u0438 \u0441 \u043F\u043E\u043C\u043E\u0449\u044C\u044E Cheso.",
    detail: "docs/DETAIL.ru.md"
  },
  messages: {
    loginDenied: "Cheso \u043E\u0442\u043A\u043B\u043E\u043D\u0438\u043B \u0437\u0430\u043F\u0440\u043E\u0441 \u043D\u0430 \u0432\u0445\u043E\u0434. \u041F\u043E\u043B\u0443\u0447\u0438\u0442\u0435 \u043D\u043E\u0432\u0443\u044E \u0441\u0441\u044B\u043B\u043A\u0443 \u0434\u043B\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u0438 \u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u043F\u043E\u043F\u044B\u0442\u043A\u0443.",
    loginIncomplete: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u044C \u0432\u0445\u043E\u0434 \u0432 Cheso. \u041F\u043E\u043B\u0443\u0447\u0438\u0442\u0435 \u043D\u043E\u0432\u0443\u044E \u0441\u0441\u044B\u043B\u043A\u0443 \u0434\u043B\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u0438.",
    task: "\u0417\u0430\u0434\u0430\u0447\u0430 Cheso",
    taskId: "\u0417\u0430\u0434\u0430\u0447\u0430 Cheso {id}",
    artifacts: "\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u044B Cheso",
    preparing: "\u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0430\u2026",
    generating: "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435\u2026",
    toolFailed: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0432\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u044C \u0437\u0430\u043F\u0440\u043E\u0441 \u043A Cheso",
    taskCompleted: "\u0417\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043E \xB7 \u0424\u0430\u0439\u043B\u043E\u0432: {count}",
    taskRunning: "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u0435\u0442\u0441\u044F",
    taskQueued: "\u0412 \u043E\u0447\u0435\u0440\u0435\u0434\u0438",
    lowCredits: "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043A\u0440\u0435\u0434\u0438\u0442\u043E\u0432",
    taskFailed: "\u041E\u0448\u0438\u0431\u043A\u0430",
    taskStopped: "\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E",
    taskRolledBack: "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u043E\u0442\u043C\u0435\u043D\u0435\u043D\u044B",
    taskNeedsReply: "\u041E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F \u0432\u0430\u0448 \u043E\u0442\u0432\u0435\u0442",
    questionRound: "\u0420\u0430\u0443\u043D\u0434 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432 {number}",
    questionAnswered: "\u041E\u0442\u0432\u0435\u0447\u0435\u043D\u043E",
    questionSkipped: "\u041F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u043E",
    taskUnknown: "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0441\u0442\u0430\u0442\u0443\u0441",
    fileList: "\u0424\u0430\u0439\u043B\u044B Cheso",
    resultBadge: "\u0418\u0442\u043E\u0433\u043E\u0432\u044B\u0439 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442",
    openInCheso: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0432 Cheso",
    editInCheso: "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0432 Cheso",
    open: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C",
    preview: "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440",
    loginTitle: "\u0412\u0445\u043E\u0434 \u0432 Cheso",
    loginRequired: "\u0412\u043E\u0439\u0434\u0438\u0442\u0435 \u0432 Cheso, \u0447\u0442\u043E\u0431\u044B \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C.",
    loginInstructions: "\u0420\u0430\u0437\u0440\u0435\u0448\u0438\u0442\u0435 \u0434\u043E\u0441\u0442\u0443\u043F \u0432 Cheso, \u0437\u0430\u0442\u0435\u043C \u0432\u0435\u0440\u043D\u0438\u0442\u0435\u0441\u044C \u0441\u044E\u0434\u0430 \u0438 \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \xAB\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0432\u0445\u043E\u0434\xBB.",
    loginEnterCode: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u044D\u0442\u043E\u0442 \u043A\u043E\u0434 \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u0438:",
    loginAuthorize: "\u0420\u0430\u0437\u0440\u0435\u0448\u0438\u0442\u044C \u0434\u043E\u0441\u0442\u0443\u043F \u0432 Cheso",
    loginCheck: "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0432\u0445\u043E\u0434",
    loginChecking: "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430\u2026",
    loginGetLink: "\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0443 \u0434\u043B\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u0438",
    loginGetNewLink: "\u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u043D\u043E\u0432\u0443\u044E \u0441\u0441\u044B\u043B\u043A\u0443 \u0434\u043B\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u0438",
    loginGettingLink: "\u041F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0435 \u0441\u0441\u044B\u043B\u043A\u0438\u2026",
    loginExpired: "\u0421\u0440\u043E\u043A \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u0441\u0441\u044B\u043B\u043A\u0438 \u0438\u0441\u0442\u0451\u043A. \u041F\u043E\u043B\u0443\u0447\u0438\u0442\u0435 \u043D\u043E\u0432\u0443\u044E \u0441\u0441\u044B\u043B\u043A\u0443 \u0434\u043B\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u0438.",
    loginSignedIn: "\u0412\u044B \u0432\u043E\u0448\u043B\u0438 \u0432 Cheso. \u041E\u0442\u043F\u0440\u0430\u0432\u044C\u0442\u0435 \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0439 \u0437\u0430\u043F\u0440\u043E\u0441 \u0435\u0449\u0451 \u0440\u0430\u0437.",
    loginWaiting: "\u0410\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F \u0435\u0449\u0451 \u043D\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430. \u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u0435 \u0435\u0451 \u0432 Cheso \u0438 \u043F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0432\u0445\u043E\u0434 \u0441\u043D\u043E\u0432\u0430.",
    loginNotStarted: "\u0412\u0445\u043E\u0434 \u043D\u0435 \u043D\u0430\u0447\u0430\u0442 \u0438\u043B\u0438 \u043E\u0442\u043C\u0435\u043D\u0451\u043D. \u041F\u043E\u043B\u0443\u0447\u0438\u0442\u0435 \u043D\u043E\u0432\u0443\u044E \u0441\u0441\u044B\u043B\u043A\u0443 \u0434\u043B\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u0438.",
    loginFailed: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0432\u043E\u0439\u0442\u0438 \u0432 Cheso. \u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u043F\u043E\u043F\u044B\u0442\u043A\u0443.",
    fixedTokenRejected: "Cheso \u043E\u0442\u043A\u043B\u043E\u043D\u0438\u043B \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u043D\u044B\u0439 API-\u0442\u043E\u043A\u0435\u043D. \u041E\u0431\u043D\u043E\u0432\u0438\u0442\u0435 \u0438\u043B\u0438 \u0443\u0434\u0430\u043B\u0438\u0442\u0435 \u0435\u0433\u043E \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445 \u0438\u043B\u0438 \u0441\u0440\u0435\u0434\u0435 \u0437\u0430\u043F\u0443\u0441\u043A\u0430 DSH, \u0437\u0430\u0442\u0435\u043C \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 DSH.",
    loginInvalidLink: "Cheso \u043D\u0435 \u0432\u0435\u0440\u043D\u0443\u043B \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u0443\u044E \u0441\u0441\u044B\u043B\u043A\u0443 \u0434\u043B\u044F \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u0438.",
    loginUnknownSite: "\u042D\u0442\u043E\u0442 \u0441\u0430\u0439\u0442 Cheso \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0441\u0430\u0439\u0442\u0430 \u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u043F\u043E\u043F\u044B\u0442\u043A\u0443.",
    previewTitle: "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 Cheso",
    previewOpenFailed: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 Cheso.",
    previewLoginRequired: "\u0412\u043E\u0439\u0434\u0438\u0442\u0435 \u043D\u0430 \u0441\u0430\u0439\u0442 Cheso, \u0433\u0434\u0435 \u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F \u0444\u0430\u0439\u043B, \u0438 \u0441\u043D\u043E\u0432\u0430 \u043E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440.",
    previewForbidden: "\u0423 \u0432\u0430\u0448\u0435\u0439 \u0443\u0447\u0451\u0442\u043D\u043E\u0439 \u0437\u0430\u043F\u0438\u0441\u0438 Cheso \u043D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u044D\u0442\u043E\u043C\u0443 \u0444\u0430\u0439\u043B\u0443.",
    previewUnknownSite: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043D\u0430\u0439\u0442\u0438 \u0441\u0430\u0439\u0442 Cheso \u0434\u043B\u044F \u044D\u0442\u043E\u0433\u043E \u0444\u0430\u0439\u043B\u0430. \u0421\u043D\u043E\u0432\u0430 \u0437\u0430\u043F\u0440\u043E\u0441\u0438\u0442\u0435 \u0441\u043F\u0438\u0441\u043E\u043A \u0444\u0430\u0439\u043B\u043E\u0432 \u043F\u0440\u043E\u0435\u043A\u0442\u0430, \u0437\u0430\u0442\u0435\u043C \u043E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440.",
    previewSessionExpired: "\u0421\u0435\u0430\u043D\u0441 DSH \u0438\u0441\u0442\u0451\u043A. \u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u0435\u0441\u044C \u0441\u043D\u043E\u0432\u0430 \u0438 \u043E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440.",
    previewUrlRequestFailed: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C URL \u0444\u0430\u0439\u043B\u0430 (HTTP {status}).",
    previewInvalidFileUrl: "\u041D\u0435\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 URL \u0444\u0430\u0439\u043B\u0430.",
    previewReopen: "\u0421\u043D\u043E\u0432\u0430 \u043E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0438\u0437 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u043E\u0432 Cheso \u0432 \u0447\u0430\u0442\u0435.",
    previewUnsupported: "\u042D\u0442\u043E\u0442 \u0444\u0430\u0439\u043B \u043C\u043E\u0436\u043D\u043E \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u0432 Cheso.",
    previewInvalidEmbedUrl: "\u041D\u0435\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 URL \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 Cheso.",
    previewTimedOut: "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u043B\u0441\u044F. \u041D\u0430\u0436\u043C\u0438\u0442\u0435 \xAB\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0432 Cheso\xBB.",
    previewLoadFailed: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440.",
    previewFileStored: "\u0424\u0430\u0439\u043B {name} \u043F\u043E-\u043F\u0440\u0435\u0436\u043D\u0435\u043C\u0443 \u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F \u0432 Cheso. \u0415\u0433\u043E \u043C\u043E\u0436\u043D\u043E \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u0442\u0430\u043C.",
    previewLoading: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 Cheso\u2026",
    settingsSummary: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0430\u0439\u0442 Cheso.",
    settingsLoading: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A \u0441\u0430\u0439\u0442\u0430\u2026",
    settingsUnavailable: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0441\u0430\u0439\u0442\u0430 \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B.",
    settingsSite: "\u0421\u0430\u0439\u0442 Cheso",
    settingsConfigured: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0437\u0430\u043F\u0443\u0441\u043A\u0430",
    settingsHelp: "\u0412\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u0441\u0430\u0439\u0442 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u0434\u043B\u044F \u0432\u0445\u043E\u0434\u0430 \u0438 \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432 \u043D\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u043F\u0440\u043E\u0435\u043A\u0442\u043E\u0432. \u0421\u0435\u0430\u043D\u0441 \u0432\u0445\u043E\u0434\u0430 \u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E \u0434\u043B\u044F \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u0441\u0430\u0439\u0442\u0430.",
    settingsStartupLocked: "\u0421\u0430\u0439\u0442 \u0437\u0430\u0434\u0430\u043D \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0435\u0439 \u0437\u0430\u043F\u0443\u0441\u043A\u0430.",
    settingsPreviewHost: "\u0421\u0435\u0440\u0432\u0435\u0440 \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430: {host}.",
    settingsSaving: "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435\u2026",
    settingsFailed: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0441\u0430\u0439\u0442. \u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u043F\u043E\u043F\u044B\u0442\u043A\u0443.",
    accountTitle: "\u0410\u043A\u043A\u0430\u0443\u043D\u0442 Cheso",
    accountHint: "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0430\u043A\u043A\u0430\u0443\u043D\u0442 Cheso, \u0447\u0442\u043E\u0431\u044B \u0441\u043E\u0437\u0434\u0430\u0432\u0430\u0442\u044C \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u044B \u0432 \u0447\u0430\u0442\u0435. \u041A\u0430\u0436\u0434\u044B\u0439 \u0441\u0430\u0439\u0442 Cheso \u0445\u0440\u0430\u043D\u0438\u0442 \u0441\u0432\u043E\u0439 \u0432\u0445\u043E\u0434 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E.",
    accountSite: "\u0421\u0430\u0439\u0442: {host}",
    accountChecking: "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0432\u0445\u043E\u0434\u0430\u2026",
    accountSignedIn: "\u0412\u044B \u0432\u043E\u0448\u043B\u0438 \u0432 Cheso.",
    accountSignedOut: "\u0412\u044B \u043D\u0435 \u0432\u043E\u0448\u043B\u0438 \u043D\u0430 \u044D\u0442\u043E\u0442 \u0441\u0430\u0439\u0442 Cheso.",
    accountConnect: "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0430\u043A\u043A\u0430\u0443\u043D\u0442 Cheso",
    accountStatusFailed: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0432\u0445\u043E\u0434 \u0432 Cheso. \u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u043F\u043E\u043F\u044B\u0442\u043A\u0443.",
    accountWaiting: "\u041E\u0436\u0438\u0434\u0430\u043D\u0438\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u0438\u2026",
    accountInstructions: "\u0417\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044E \u0432 Cheso \u0438 \u0432\u0435\u0440\u043D\u0438\u0442\u0435\u0441\u044C \u0441\u044E\u0434\u0430 \u2014 \u0432\u0445\u043E\u0434 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438."
  }
};

// locale/zh.json
var zh_default = {
  meta: {
    title: "Cheso Design",
    description: "\u4F7F\u7528Cheso\u5C06\u4F60\u7684\u521B\u610F\u3001\u6587\u4EF6\u548C\u7814\u7A76\u6210\u679C\u521B\u4F5C\u4E3A\u60CA\u8273\u7684PPT\u3001\u6D77\u62A5\u3001\u89C6\u9891\u7B49\u521B\u610F\u4F5C\u54C1\u3002\u5E76\u4E14\u4E00\u7AD9\u5F0F\u7F16\u8F91\u3001\u534F\u4F5C\u4E0E\u5206\u4EAB\u3002",
    detail: "docs/DETAIL.zh.md"
  },
  messages: {
    loginDenied: "Cheso \u767B\u5F55\u8BF7\u6C42\u5DF2\u88AB\u62D2\u7EDD\u3002\u8BF7\u91CD\u65B0\u83B7\u53D6\u6388\u6743\u94FE\u63A5\u3002",
    loginIncomplete: "Cheso \u767B\u5F55\u672A\u5B8C\u6210\u3002\u8BF7\u91CD\u65B0\u83B7\u53D6\u6388\u6743\u94FE\u63A5\u3002",
    task: "Cheso \u4EFB\u52A1",
    taskId: "Cheso \u4EFB\u52A1 {id}",
    artifacts: "Cheso \u4EA7\u7269",
    preparing: "\u51C6\u5907\u4E2D\u2026",
    generating: "\u751F\u6210\u4E2D\u2026",
    toolFailed: "Cheso \u8C03\u7528\u5931\u8D25",
    taskCompleted: "\u5DF2\u5B8C\u6210 \xB7 {count} \u4E2A\u6587\u4EF6",
    taskRunning: "\u4ECD\u5728\u751F\u6210\uFF0C\u7A0D\u540E\u7EE7\u7EED\u7B49\u5F85",
    taskQueued: "\u5DF2\u6392\u961F",
    lowCredits: "\u79EF\u5206\u4E0D\u8DB3",
    taskFailed: "\u4EFB\u52A1\u5931\u8D25",
    taskStopped: "\u5DF2\u7EC8\u6B62",
    taskRolledBack: "\u5DF2\u56DE\u9000",
    taskNeedsReply: "\u7B49\u5F85\u56DE\u590D",
    questionRound: "\u7B2C {number} \u8F6E\u95EE\u7B54",
    questionAnswered: "\u5DF2\u56DE\u7B54",
    questionSkipped: "\u5DF2\u8DF3\u8FC7",
    taskUnknown: "\u72B6\u6001\u672A\u77E5",
    fileList: "Cheso \u6587\u4EF6\u5217\u8868",
    resultBadge: "\u6700\u7EC8\u4EA7\u7269",
    openInCheso: "\u5728 Cheso \u6253\u5F00",
    editInCheso: "\u5728 Cheso \u7F16\u8F91",
    open: "\u6253\u5F00",
    preview: "\u9884\u89C8",
    loginTitle: "Cheso \u767B\u5F55",
    loginRequired: "\u8BF7\u5148\u767B\u5F55 Cheso\uFF0C\u518D\u7EE7\u7EED\u521A\u624D\u7684\u64CD\u4F5C\u3002",
    loginInstructions: "\u70B9\u51FB\u300C\u53BB Cheso \u6388\u6743\u300D\uFF0C\u5B8C\u6210\u540E\u8FD4\u56DE\u8FD9\u91CC\uFF0C\u518D\u70B9\u51FB\u300C\u68C0\u67E5\u767B\u5F55\u300D\u3002",
    loginEnterCode: "\u8BF7\u5728\u6388\u6743\u9875\u8F93\u5165\u9A8C\u8BC1\u7801\uFF1A",
    loginAuthorize: "\u53BB Cheso \u6388\u6743",
    loginCheck: "\u68C0\u67E5\u767B\u5F55",
    loginChecking: "\u6B63\u5728\u68C0\u67E5\u2026",
    loginGetLink: "\u83B7\u53D6\u6388\u6743\u94FE\u63A5",
    loginGetNewLink: "\u91CD\u65B0\u83B7\u53D6\u6388\u6743\u94FE\u63A5",
    loginGettingLink: "\u6B63\u5728\u83B7\u53D6\u2026",
    loginExpired: "\u6388\u6743\u94FE\u63A5\u5DF2\u5931\u6548\uFF0C\u8BF7\u91CD\u65B0\u83B7\u53D6\u3002",
    loginSignedIn: "\u5DF2\u767B\u5F55 Cheso\u3002\u8BF7\u91CD\u65B0\u53D1\u9001\u521A\u624D\u7684\u8BF7\u6C42\u3002",
    loginWaiting: "\u8FD8\u6CA1\u6536\u5230\u6388\u6743\u3002\u8BF7\u5148\u5728 Cheso \u9875\u9762\u5B8C\u6210\u64CD\u4F5C\uFF0C\u518D\u56DE\u6765\u68C0\u67E5\u3002",
    loginNotStarted: "\u767B\u5F55\u5C1A\u672A\u53D1\u8D77\u6216\u5DF2\u53D6\u6D88\u3002\u8BF7\u91CD\u65B0\u83B7\u53D6\u6388\u6743\u94FE\u63A5\u3002",
    loginFailed: "Cheso \u767B\u5F55\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u3002",
    fixedTokenRejected: "Cheso \u62D2\u7EDD\u4E86\u914D\u7F6E\u7684 API token\u3002\u8BF7\u5728 DSH \u914D\u7F6E\u6216\u542F\u52A8\u73AF\u5883\u4E2D\u66F4\u65B0\u6216\u79FB\u9664\u5B83\uFF0C\u7136\u540E\u91CD\u542F DSH\u3002",
    loginInvalidLink: "Cheso \u672A\u8FD4\u56DE\u6709\u6548\u7684\u6388\u6743\u94FE\u63A5\u3002",
    loginUnknownSite: "\u8BE5\u7AD9\u70B9\u5DF2\u4E0D\u5728\u63D2\u4EF6\u914D\u7F6E\u4E2D\u3002\u8BF7\u68C0\u67E5\u7AD9\u70B9\u8BBE\u7F6E\u5E76\u91CD\u65B0\u53D1\u8D77\u8BF7\u6C42\u3002",
    previewTitle: "Cheso \u9884\u89C8",
    previewOpenFailed: "\u65E0\u6CD5\u6253\u5F00 Cheso \u9884\u89C8\u3002",
    previewLoginRequired: "\u8BF7\u5148\u767B\u5F55\u4EA7\u7269\u6240\u5C5E\u7684 Cheso \u7AD9\u70B9\uFF0C\u518D\u6253\u5F00\u9884\u89C8\u3002",
    previewForbidden: "\u5F53\u524D Cheso \u8D26\u53F7\u65E0\u6743\u67E5\u770B\u6B64\u6587\u4EF6\u3002",
    previewUnknownSite: "\u627E\u4E0D\u5230\u6B64\u4EA7\u7269\u7684 Cheso \u7AD9\u70B9\uFF0C\u8BF7\u91CD\u65B0\u67E5\u8BE2\u9879\u76EE\u540E\u6253\u5F00\u9884\u89C8\u3002",
    previewSessionExpired: "DSH \u767B\u5F55\u5DF2\u5931\u6548\uFF0C\u8BF7\u91CD\u65B0\u8FDE\u63A5\u540E\u6253\u5F00\u9884\u89C8\u3002",
    previewUrlRequestFailed: "\u6587\u4EF6\u5730\u5740\u83B7\u53D6\u5931\u8D25\uFF08HTTP {status}\uFF09\u3002",
    previewInvalidFileUrl: "\u6587\u4EF6\u5730\u5740\u65E0\u6548\u3002",
    previewReopen: "\u8BF7\u4ECE\u5BF9\u8BDD\u4E2D\u7684 Cheso \u4EA7\u7269\u5361\u91CD\u65B0\u6253\u5F00\u9884\u89C8\u3002",
    previewUnsupported: "\u6B64\u6587\u4EF6\u53EF\u5728 Cheso \u4E2D\u6253\u5F00\u3002",
    previewInvalidEmbedUrl: "Cheso \u9884\u89C8\u5730\u5740\u65E0\u6548\u3002",
    previewTimedOut: "\u5185\u5D4C\u9884\u89C8\u672A\u80FD\u52A0\u8F7D\uFF0C\u8BF7\u70B9\u51FB\u300C\u5728 Cheso \u7F16\u8F91\u300D\u3002",
    previewLoadFailed: "\u9884\u89C8\u52A0\u8F7D\u5931\u8D25\u3002",
    previewFileStored: "\u6587\u4EF6 {name} \u4ECD\u4FDD\u5B58\u5728 Cheso\uFF0C\u53EF\u56DE\u5230 Cheso \u6253\u5F00\u3002",
    previewLoading: "\u6B63\u5728\u52A0\u8F7D Cheso \u9884\u89C8\u2026",
    settingsSummary: "\u9009\u62E9 Cheso \u7AD9\u70B9\u3002",
    settingsLoading: "\u6B63\u5728\u8BFB\u53D6\u7AD9\u70B9\u8BBE\u7F6E\u2026",
    settingsUnavailable: "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u7AD9\u70B9\u8BBE\u7F6E\u3002",
    settingsSite: "Cheso \u7AD9\u70B9",
    settingsConfigured: "\u542F\u52A8\u914D\u7F6E",
    settingsHelp: "\u767B\u5F55\u548C\u65B0\u9879\u76EE\u8BF7\u6C42\u4F7F\u7528\u6240\u9009\u7AD9\u70B9\uFF0C\u5404\u7AD9\u70B9\u7684\u767B\u5F55\u72B6\u6001\u72EC\u7ACB\u4FDD\u5B58\u3002",
    settingsStartupLocked: "\u7AD9\u70B9\u7531\u542F\u52A8\u914D\u7F6E\u56FA\u5B9A\u3002",
    settingsPreviewHost: "\u9884\u89C8\u5730\u5740\uFF1A{host}\u3002",
    settingsSaving: "\u6B63\u5728\u4FDD\u5B58\u2026",
    settingsFailed: "\u7AD9\u70B9\u5207\u6362\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u3002",
    accountTitle: "Cheso \u8D26\u53F7",
    accountHint: "\u8FDE\u63A5 Cheso \u8D26\u53F7\u540E\uFF0C\u5C31\u80FD\u5728\u5BF9\u8BDD\u91CC\u751F\u6210\u6210\u54C1\u3002\u767B\u5F55\u72B6\u6001\u6309\u7AD9\u70B9\u5206\u522B\u4FDD\u5B58\u3002",
    accountSite: "\u7AD9\u70B9\uFF1A{host}",
    accountChecking: "\u6B63\u5728\u68C0\u67E5\u767B\u5F55\u72B6\u6001\u2026",
    accountSignedIn: "\u5DF2\u767B\u5F55 Cheso\u3002",
    accountSignedOut: "\u5F53\u524D\u7AD9\u70B9\u5C1A\u672A\u767B\u5F55 Cheso\u3002",
    accountConnect: "\u8FDE\u63A5 Cheso \u8D26\u53F7",
    accountStatusFailed: "\u65E0\u6CD5\u68C0\u67E5 Cheso \u767B\u5F55\u72B6\u6001\uFF0C\u8BF7\u91CD\u8BD5\u3002",
    accountWaiting: "\u7B49\u5F85\u6D4F\u89C8\u5668\u6388\u6743\u2026",
    accountInstructions: "\u5728 Cheso \u5B8C\u6210\u6388\u6743\u540E\u56DE\u5230\u8FD9\u91CC\uFF0C\u767B\u5F55\u72B6\u6001\u4F1A\u81EA\u52A8\u786E\u8BA4\u3002"
  }
};

// src/client/i18n.ts
var localeNamespace = "dsh-cheso-design";
var dictionaries = {
  de: de_default.messages,
  en: en_default.messages,
  es: es_default.messages,
  fr: fr_default.messages,
  ja: ja_default.messages,
  pt: pt_default.messages,
  ru: ru_default.messages,
  zh: zh_default.messages
};

// src/client/login.ts
var LoginRequestError = class extends Error {
  constructor(code) {
    super(code ?? "login_failed");
    this.code = code;
  }
};
async function requestLogin(action, site, signal) {
  const response = await fetch("/api/cheso/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, site }),
    signal
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) throw new LoginRequestError(result?.code);
  return result;
}
function authorizationUrl(payload) {
  if (!payload.verification_uri || !payload.base_url || !URL.canParse(payload.verification_uri) || !URL.canParse(payload.base_url)) return void 0;
  const url = new URL(payload.verification_uri);
  if (["https:", "http:"].includes(url.protocol) && !url.username && !url.password && url.origin === new URL(payload.base_url).origin) {
    return url.href;
  }
  return void 0;
}
function loginErrorKey(code) {
  switch (code) {
    case "login_expired":
      return "loginExpired";
    case "login_denied":
      return "loginDenied";
    case "login_incomplete":
      return "loginIncomplete";
    case "unknown_cheso_site":
      return "loginUnknownSite";
    case "fixed_token_rejected":
      return "fixedTokenRejected";
    default:
      return "loginFailed";
  }
}

// src/client/question-previews.tsx
var import_react = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
function useQuestionActivity(callId) {
  const [activity, setActivity] = (0, import_react.useState)({ previews: null });
  (0, import_react.useEffect)(() => {
    if (!callId) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ call_id: callId });
    let next;
    async function poll() {
      try {
        const response = await fetch(`/api/cheso/question-previews?${query}`, { signal: controller.signal });
        if (response.ok) {
          const state = await response.json();
          if (!controller.signal.aborted) setActivity(state);
        }
      } catch {
      } finally {
        if (!controller.signal.aborted) next = setTimeout(poll, 2e3);
      }
    }
    void poll();
    return () => {
      controller.abort();
      clearTimeout(next);
    };
  }, [callId]);
  return activity;
}
var SLIDE_WIDTH = 1280;
var SLIDE_HEIGHT = 720;
var PREVIEW_HEADER = `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'"><style>html,body{margin:0;overflow:hidden}</style>`;
function SlidePreview({ label, html }) {
  const viewport = (0, import_react.useRef)(null);
  const [width, setWidth] = (0, import_react.useState)(0);
  (0, import_react.useEffect)(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("figure", { style: {
    margin: 0,
    minWidth: 0,
    border: "1px solid var(--dsh-border, rgba(127,127,127,.25))",
    borderRadius: 8,
    overflow: "hidden"
  }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { ref: viewport, style: { position: "relative", aspectRatio: "16 / 9", overflow: "hidden", background: "#fff" }, children: width > 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "iframe",
      {
        title: label,
        srcDoc: PREVIEW_HEADER + html,
        sandbox: "",
        tabIndex: -1,
        referrerPolicy: "no-referrer",
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          border: 0,
          pointerEvents: "none",
          transformOrigin: "top left",
          transform: `scale(${width / SLIDE_WIDTH})`
        }
      }
    ) : null }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("figcaption", { style: { padding: "4px 8px", overflowWrap: "anywhere" }, children: label })
  ] });
}
function QuestionPreviews({ previews }) {
  if (!previews.length) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 168px), 1fr))",
    gap: 8,
    marginBottom: 8
  }, children: previews.map((preview, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SlidePreview, { ...preview }, index)) });
}

// src/client/site-settings.tsx
var import_react3 = require("react");

// src/client/account.tsx
var import_react2 = require("react");
var import_jsx_runtime3 = require("react/jsx-runtime");
function siteHost(url) {
  if (!url || !URL.canParse(url)) return void 0;
  return new URL(url).host;
}
function isEndedLoginAttempt(key) {
  return key === "loginExpired" || key === "loginDenied" || key === "loginIncomplete";
}
function ChesoAccountStatus({ t, disabled, showSite }) {
  const [phase, setPhase] = (0, import_react2.useState)("checking");
  const phaseRef = (0, import_react2.useRef)("checking");
  const generation = (0, import_react2.useRef)(0);
  const [challenge, setChallenge] = (0, import_react2.useState)();
  const [authorizationOpened, setAuthorizationOpened] = (0, import_react2.useState)(false);
  const [starting, setStarting] = (0, import_react2.useState)(false);
  const [notice, setNotice] = (0, import_react2.useState)();
  const [error, setError] = (0, import_react2.useState)();
  const [expiredAt, setExpiredAt] = (0, import_react2.useState)(0);
  const [baseUrl, setBaseUrl] = (0, import_react2.useState)();
  function moveTo(next) {
    phaseRef.current = next;
    setPhase(next);
  }
  async function begin(site, signal) {
    const id = ++generation.current;
    setStarting(true);
    setError(void 0);
    setNotice(void 0);
    try {
      const result = await requestLogin("start", site, signal);
      if (signal?.aborted || id !== generation.current || phaseRef.current === "signed_in") return;
      if (result.base_url) setBaseUrl(result.base_url);
      if (result.status === "signed_in") {
        setChallenge(void 0);
        moveTo("signed_in");
        return;
      }
      const href2 = authorizationUrl(result);
      if (result.status === "login_pending" && href2) {
        setChallenge(result);
        setAuthorizationOpened(false);
        setExpiredAt(0);
        moveTo("pending");
        return href2;
      }
      if (result.status === "login_required") {
        moveTo("signed_out");
        setError("loginNotStarted");
        return;
      }
      moveTo("signed_out");
      setError("loginInvalidLink");
    } catch (reason) {
      if (signal?.aborted || id !== generation.current) return;
      const key = reason instanceof LoginRequestError ? loginErrorKey(reason.code) : "loginFailed";
      moveTo(key === "fixedTokenRejected" ? "unavailable" : "signed_out");
      setError(key);
    } finally {
      if (!signal?.aborted && id === generation.current) setStarting(false);
    }
  }
  async function connect(site) {
    const desktop = "dshDesktop" in window;
    const tab = desktop ? null : window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    const href2 = await begin(site);
    if (!href2) {
      tab?.close();
      return;
    }
    if (desktop) {
      window.open(href2, "_blank", "noopener,noreferrer");
      setAuthorizationOpened(true);
    } else if (tab && !tab.closed) {
      tab.location.replace(href2);
      setAuthorizationOpened(true);
    }
  }
  (0, import_react2.useEffect)(() => {
    const controller = new AbortController();
    const { signal } = controller;
    async function loadStatus() {
      try {
        const result = await requestLogin("check", void 0, signal);
        if (signal.aborted) return;
        if (result.base_url) setBaseUrl(result.base_url);
        if (result.status === "waiting") {
          await begin(result.base_url, signal);
        } else {
          moveTo(result.status === "signed_in" ? "signed_in" : "signed_out");
        }
      } catch (reason) {
        if (signal.aborted) return;
        const key = reason instanceof LoginRequestError && reason.code ? loginErrorKey(reason.code) : "accountStatusFailed";
        if (isEndedLoginAttempt(key)) {
          moveTo("signed_out");
          return;
        }
        moveTo("unavailable");
        setError(key);
      }
    }
    void loadStatus();
    return () => {
      generation.current++;
      controller.abort();
    };
  }, []);
  const expiresAt = challenge?.expires_at ?? 0;
  (0, import_react2.useEffect)(() => {
    if (!expiresAt) return;
    const timer = setTimeout(() => setExpiredAt(expiresAt), Math.max(0, expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [expiresAt]);
  (0, import_react2.useEffect)(() => {
    if (phase !== "pending" || !challenge) return;
    const controller = new AbortController();
    const deadline = challenge.expires_at ?? 0;
    let timer;
    const poll = async () => {
      if (controller.signal.aborted) return;
      if (deadline && Date.now() >= deadline) {
        setExpiredAt(deadline);
        return;
      }
      try {
        const result = await requestLogin("check", challenge.base_url, controller.signal);
        if (controller.signal.aborted) return;
        if (result.base_url) setBaseUrl(result.base_url);
        if (result.status === "signed_in") {
          setChallenge(void 0);
          setExpiredAt(0);
          setError(void 0);
          moveTo("signed_in");
          return;
        }
        if (result.status === "login_required") {
          setExpiredAt(deadline || Date.now());
          setNotice("loginNotStarted");
          setError(void 0);
          return;
        }
      } catch (reason) {
        if (controller.signal.aborted) return;
        if (reason instanceof LoginRequestError) {
          const key = loginErrorKey(reason.code);
          if (key === "fixedTokenRejected") {
            setChallenge(void 0);
            setError(key);
            moveTo("unavailable");
            return;
          }
          if (isEndedLoginAttempt(key) || key === "loginUnknownSite") {
            setExpiredAt(deadline || Date.now());
            setNotice(key);
            setError(void 0);
            return;
          }
        }
      }
      timer = setTimeout(poll, 5e3);
    };
    timer = setTimeout(poll, 1500);
    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [phase, challenge]);
  const live = !expiredAt && (!expiresAt || expiresAt > Date.now());
  const href = challenge && live ? authorizationUrl(challenge) : void 0;
  const host = showSite ? siteHost(challenge?.base_url ?? baseUrl) : void 0;
  const statusText = phase === "checking" ? t("accountChecking") : phase === "pending" ? t(href ? "accountWaiting" : notice ?? "loginExpired") : phase === "unavailable" ? t(error ?? "accountStatusFailed") : phase === "signed_in" ? t("accountSignedIn") : t("accountSignedOut");
  const statusColor = phase === "signed_in" ? "var(--dsw-alias-state-success-primary, #16a34a)" : phase === "unavailable" ? "var(--dsw-alias-state-error-primary, #dc2626)" : "var(--dsw-alias-state-idle-primary, #9ca3af)";
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: styles.statusRow, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: styles.status, role: "status", "aria-live": "polite", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { ...styles.dot, background: statusColor } }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { children: [
          statusText,
          host ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { style: styles.caption, children: [
            " ",
            t("accountSite", { host })
          ] }) : null
        ] })
      ] }),
      error !== "fixedTokenRejected" && (phase === "signed_out" || phase === "unavailable" || phase === "pending" && !href) ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "button",
        {
          type: "button",
          className: "cheso-account-primary",
          style: styles.primary,
          disabled: disabled || starting,
          onClick: () => void connect(challenge?.base_url),
          children: t(starting ? "loginGettingLink" : "accountConnect")
        }
      ) : null,
      phase === "pending" && href && !authorizationOpened && !disabled ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "a",
        {
          href,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "cheso-account-primary",
          style: styles.primary,
          children: t("loginAuthorize")
        }
      ) : null
    ] }),
    phase === "pending" && href && challenge?.user_code ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: styles.hint, children: [
      t("loginEnterCode"),
      " ",
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("code", { style: styles.code, children: challenge.user_code })
    ] }) : null,
    error && phase !== "unavailable" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { role: "alert", style: styles.error, children: t(error) }) : null
  ] });
}
var styles = {
  caption: {
    marginInlineStart: 8,
    fontSize: 12,
    lineHeight: "18px",
    color: "var(--dsw-alias-label-secondary, #888)"
  },
  hint: {
    margin: 0,
    fontSize: 13,
    lineHeight: "20px",
    color: "var(--dsw-alias-label-secondary, #888)"
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minHeight: 28,
    flexWrap: "wrap"
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flex: "none"
  },
  status: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flex: "1 1 auto",
    minWidth: 0,
    fontSize: 13,
    lineHeight: "20px",
    color: "var(--dsw-alias-label-primary, inherit)"
  },
  primary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "none",
    marginInlineStart: "auto",
    height: 28,
    padding: "0 12px",
    border: "none",
    borderRadius: "var(--dsw-radius-sm, 8px)",
    fontFamily: "inherit",
    fontSize: 12,
    lineHeight: "18px",
    fontWeight: 500,
    textDecoration: "none",
    cursor: "pointer"
  },
  code: {
    padding: "1px 5px",
    borderRadius: 4,
    background: "var(--dsw-alias-bg-module-platform, rgba(127,127,127,.12))",
    fontFamily: "var(--ds-font-family-code, ui-monospace, SFMono-Regular, Menlo, monospace)"
  },
  error: {
    fontSize: 13,
    lineHeight: "20px",
    color: "var(--dsw-alias-state-error-primary, #dc2626)",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word"
  }
};

// src/client/site-settings.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
async function loadSiteOptions(signal) {
  const response = await fetch("/api/cheso/site-options", { signal });
  return response.ok ? response.json() : null;
}
function ChesoSettings({ form, t }) {
  const subscribe = (0, import_react3.useCallback)((listener) => form.subscribe(listener), [form]);
  const getSnapshot = (0, import_react3.useCallback)(() => form.getSnapshot(), [form]);
  const state = (0, import_react3.useSyncExternalStore)(subscribe, getSnapshot);
  const headingId = (0, import_react3.useId)();
  const [options, setOptions] = (0, import_react3.useState)();
  const [saving, setSaving] = (0, import_react3.useState)(false);
  const [failed, setFailed] = (0, import_react3.useState)(false);
  (0, import_react3.useEffect)(() => {
    const controller = new AbortController();
    void loadSiteOptions(controller.signal).then((result) => {
      if (!controller.signal.aborted) setOptions(result);
    }).catch(() => {
      if (!controller.signal.aborted) setOptions(null);
    });
    return () => controller.abort();
  }, []);
  const site = state.value?.site ?? "configured";
  const configuredHost = options?.configuredHost;
  const previewHost = options?.previewHost;
  const lockedByStartupConfig = options?.lockedByStartupConfig;
  const ready = state.status === "ready";
  const globalHost = new URL(CHESO_SITES.global).host;
  const showSiteSelect = ready && configuredHost && configuredHost !== globalHost;
  const showPreviewHost = ready && site === "configured" && previewHost && previewHost !== configuredHost;
  async function changeSite(site2) {
    setSaving(true);
    setFailed(false);
    try {
      const accepted = await form.mutate([{ op: "set", path: ["site"], value: site2 }], state.revision);
      setFailed(!accepted);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { "aria-labelledby": headingId, style: styles2.section, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: styles2.header, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h4", { id: headingId, style: styles2.title, children: t("accountTitle") }),
      showSiteSelect ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
        "select",
        {
          "aria-label": t("settingsSite"),
          className: "cheso-account-secondary",
          value: site,
          disabled: saving || !state.writable || lockedByStartupConfig,
          onChange: (event) => void changeSite(event.currentTarget.value),
          style: styles2.select,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "global", children: globalHost }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "configured", children: configuredHost })
          ]
        }
      ) : null
    ] }),
    showSiteSelect || showPreviewHost ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { style: styles2.hint, children: [
      showSiteSelect ? t(lockedByStartupConfig ? "settingsStartupLocked" : "settingsHelp") : null,
      showSiteSelect && showPreviewHost ? " " : null,
      showPreviewHost ? t("settingsPreviewHost", { host: previewHost }) : null
    ] }) : null,
    !ready ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { role: "status", style: styles2.hint, children: t(state.status === "loading" ? "settingsLoading" : "settingsUnavailable") }) : null,
    saving ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { role: "status", style: styles2.hint, children: t("settingsSaving") }) : null,
    failed ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { role: "alert", style: styles2.hint, children: t("settingsFailed") }) : null,
    state.status !== "loading" ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(ChesoAccountStatus, { t, disabled: saving, showSite: !ready || site === "configured" && !configuredHost }, site) : null
  ] });
}
var styles2 = {
  section: { display: "grid", gap: 12, minWidth: 0 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  title: { margin: 0, fontSize: 14, lineHeight: "20px", fontWeight: 500 },
  select: { maxWidth: "100%", colorScheme: "light dark" },
  hint: { margin: 0, color: "var(--dsw-alias-label-secondary, #888)", fontSize: 13, lineHeight: "20px" }
};

// src/client/index.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
var inject = ["slots", "locale", "configForms", "sidebarRight", "sidebarRightTabs", "uiConversation"];
var TAB_ID = "dsh-cheso-design-preview";
var TAB_KIND = "cheso-preview";
var RESOURCE_PREFIX = "dsh-resource://cheso-file/";
var PREVIEW_STORAGE_PREFIX = "dsh-cheso-design.preview.v1:";
var CARD_MARKER = "[cheso-card]";
var ARTIFACTS_TURN_KEY = "dsh-cheso-design-artifacts";
var WAIT_PROGRESS_DOCK = "dsh-cheso-design-progress";
var QUESTION_TIMELINE_KIND = "dsh-cheso-design-questions";
var QUESTION_TRAJECTORY_KIND = "dsh-cheso-design-question-trajectory";
var CARD_TOOLS = ["cheso_create", "cheso_wait", "cheso_stop", "cheso_project_files", "cheso_login"];
var ACTIVE_TASK_STATUSES = /* @__PURE__ */ new Set(["running", "in_progress", "pending", "queued"]);
var CARD_INLINE_PADDING = 14;
var ARTIFACT_ROW_HEIGHT = 38;
var MAX_VISIBLE_ARTIFACT_ROWS = 10;
function isLoginCard(payload) {
  return payload.status === "login_required" || payload.status === "login_pending";
}
function hideLegacyDirectories(artifacts) {
  const parents = /* @__PURE__ */ new Set();
  for (const { name, path } of artifacts) {
    if (path !== name) continue;
    const segments = name.split("/");
    segments.pop();
    while (segments.length) {
      parents.add(segments.join("/"));
      segments.pop();
    }
  }
  return artifacts.filter(({ name, path }) => path !== name || !parents.has(name) && !name.endsWith("/"));
}
function parseCard(block) {
  const content = Array.isArray(block?.content) ? block.content : [];
  for (const part of content) {
    if (part?.type !== "text" || typeof part.text !== "string") continue;
    const markerLine = part.text.lastIndexOf(`
${CARD_MARKER}`);
    const index = markerLine >= 0 ? markerLine + 1 : part.text.startsWith(CARD_MARKER) ? 0 : -1;
    if (index < 0) continue;
    const raw = part.text.slice(index + CARD_MARKER.length).trim();
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed.artifacts)) parsed.artifacts = hideLegacyDirectories(parsed.artifacts);
        return parsed;
      }
    } catch {
      return null;
    }
  }
  return null;
}
function errorText(block) {
  if (typeof block?.error?.message === "string") return block.error.message;
  const content = Array.isArray(block?.content) ? block.content : [];
  const text = content.filter((part) => part?.type === "text" && typeof part.text === "string").map((part) => part.text).join("\n").trim();
  return text;
}
var styles3 = {
  card: {
    border: "1px solid var(--dsh-border, rgba(127,127,127,.25))",
    borderRadius: 12,
    padding: `12px ${CARD_INLINE_PADDING}px`,
    margin: "8px 0",
    background: "var(--dsh-surface, transparent)",
    fontSize: 13,
    lineHeight: 1.5
  },
  head: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", flex: "none" },
  title: { fontWeight: 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" },
  status: { color: "var(--dsh-text-secondary, #888)", fontSize: 12 },
  scrollableList: {
    maxHeight: ARTIFACT_ROW_HEIGHT * MAX_VISIBLE_ARTIFACT_ROWS,
    overflowY: "auto",
    marginInlineEnd: -CARD_INLINE_PADDING,
    paddingInlineEnd: CARD_INLINE_PADDING
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    height: ARTIFACT_ROW_HEIGHT,
    boxSizing: "border-box",
    borderTop: "1px solid var(--dsh-border, rgba(127,127,127,.15))"
  },
  name: { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  resultBadge: {
    flex: "none",
    whiteSpace: "nowrap",
    fontSize: 11,
    fontWeight: 500,
    borderRadius: 4,
    padding: "2px 6px",
    background: "rgba(59,130,246,.14)"
  },
  button: {
    border: "1px solid var(--dsh-border, rgba(127,127,127,.3))",
    background: "transparent",
    color: "inherit",
    borderRadius: 6,
    padding: "3px 8px",
    fontSize: 12,
    cursor: "pointer",
    flex: "none"
  },
  link: { color: "inherit", textDecoration: "underline", fontSize: 12, opacity: 0.8 },
  message: { whiteSpace: "pre-wrap", wordBreak: "break-word" },
  error: { color: "#dc2626", whiteSpace: "pre-wrap", wordBreak: "break-word" },
  progressDock: {
    display: "grid",
    gap: 6,
    width: "min(calc(100% - 2 * var(--dsh-composer-side-clearance, 16px)), var(--dsh-composer-card-max-width, 952px))",
    marginInline: "auto",
    maxHeight: "min(40vh, 336px)",
    overflowY: "auto"
  },
  preview: { display: "flex", flexDirection: "column", height: "100%", minHeight: 0 },
  previewHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexShrink: 0,
    minHeight: 40,
    padding: "0 12px",
    borderBottom: "1px solid var(--dsh-border, rgba(127,127,127,.25))",
    fontSize: 13
  },
  previewFileName: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontWeight: 600
  },
  previewBody: { flex: "1 1 0%", minHeight: 0, overflow: "auto" }
};
function projectCardRequested(argsRaw) {
  if (typeof argsRaw !== "string") return false;
  try {
    return JSON.parse(argsRaw)?.show_card === true;
  } catch {
    return false;
  }
}
var noChat = (select) => select({ timeline: { turns: /* @__PURE__ */ new Map() }, legacy: { runningCalls: [] } });
function waitTaskReference(argsRaw) {
  try {
    const args = JSON.parse(argsRaw ?? "{}");
    return {
      taskId: typeof args?.task_id === "string" ? args.task_id : void 0,
      site: typeof args?.task_site === "string" ? args.task_site : void 0
    };
  } catch {
    return {};
  }
}
function QuestionReceipts({ receipts, t }) {
  return receipts?.map(({ answers }, index) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: styles3.card, "data-tool": "cheso-question-receipt", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: styles3.head, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { "aria-hidden": "true", style: { ...styles3.dot, background: "#16a34a" } }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: styles3.title, children: t(answers.some(({ values }) => values.length) ? "questionAnswered" : "questionSkipped") })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dl", { style: { margin: 0 }, children: answers.map(({ label, values }, answerIndex) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", flexWrap: "wrap", gap: "2px 8px", marginTop: 4 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dt", { style: styles3.status, children: label }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("dd", { style: { ...styles3.message, margin: 0, minWidth: 0 }, children: values.length ? values.join(", ") : t("questionSkipped") })
    ] }, answerIndex)) })
  ] }, index)) ?? null;
}
function WaitProgress({ call, useChat, t }) {
  const { taskId, site } = waitTaskReference(call.argsRaw);
  const turn = call.turn;
  const projectUrl = useChat((snapshot) => {
    if (turn === void 0 || !taskId) return;
    const cards = snapshot.timeline.turns.get(turn)?.data.get(ARTIFACTS_TURN_KEY)?.cards;
    const links = /* @__PURE__ */ new Set();
    for (const { payload } of cards?.values() ?? []) {
      if (payload.task_id === taskId && payload.project_url && (!site || cardTaskSite(payload) === site)) {
        links.add(payload.project_url);
      }
    }
    if (links.size === 1) return links.values().next().value;
  });
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { ...styles3.card, background: "var(--dsw-specific-menu, Canvas)", margin: 0 }, "data-tool": "cheso", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: styles3.head, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { "aria-hidden": "true", style: styles3.dot }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: styles3.title, children: t("task") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { role: "status", style: styles3.status, children: t("generating") })
    ] }),
    projectUrl ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("a", { href: projectUrl, target: "_blank", rel: "noreferrer", style: styles3.link, children: t("openInCheso") }) : null
  ] });
}
function runningWaits(calls) {
  const waits = [];
  for (const call of calls) {
    if (call.phase !== "start") continue;
    if (call.name === "cheso_wait") waits.push(call);
    waits.push(...runningWaits(call.subCalls));
  }
  return waits;
}
function WaitProgressDock({ useChat, t }) {
  const calls = useChat((snapshot) => snapshot.legacy.runningCalls);
  const waits = runningWaits(calls);
  if (!waits.length) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: styles3.progressDock, "data-cheso-progress": "", children: waits.map((call) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(WaitProgress, { call, useChat, t }, call.callId)) });
}
function ToolResultArtifact({ payload, callId, openFile, openPreview, useChat, t }) {
  const visible = useChat((snapshot) => {
    for (const turn of snapshot.timeline.turns.values()) {
      const state = turn.data.get(ARTIFACTS_TURN_KEY);
      if (!state?.callIds.has(callId)) continue;
      const card = state.cards.get(artifactCardKey(payload, callId));
      return !card || card.callId === callId && turn.status !== "closed";
    }
    return true;
  });
  return visible ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ArtifactCard, { payload, openFile, openPreview, t }) : null;
}
function ToolCard(props) {
  const { phase, block, toolName, openFile, openPreview } = props;
  const t = props.t;
  const projectQuery = toolName === "cheso_project_files";
  const stopTool = toolName === "cheso_stop";
  if (phase !== "result") {
    if (projectQuery || stopTool || toolName === "cheso_create" || toolName === "cheso_wait") return null;
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: styles3.card, "data-tool": "cheso", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: styles3.head, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: styles3.dot }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: styles3.title, children: "Cheso" }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: styles3.status, children: t(phase === "preparing" ? "preparing" : "generating") })
    ] }) });
  }
  if (block?.isError) {
    if (projectQuery && !projectCardRequested(block.call?.argsRaw)) return null;
    const detail = errorText(block);
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: styles3.card, "data-tool": "cheso", children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: styles3.head, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { ...styles3.dot, background: "#dc2626" } }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: styles3.title, children: t("toolFailed") })
      ] }),
      detail ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: styles3.error, children: detail }) : null
    ] });
  }
  const payload = parseCard(block);
  if (stopTool && payload && payload.status !== "terminated" && !isLoginCard(payload)) return null;
  if (!payload) {
    if (projectQuery || stopTool) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: styles3.card, "data-tool": "cheso", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: styles3.head, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: styles3.dot }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: styles3.title, children: "Cheso" })
    ] }) });
  }
  if (payload.task_id && payload.status && ACTIVE_TASK_STATUSES.has(payload.status) && !payload.artifacts?.length) {
    return null;
  }
  if (!isLoginCard(payload) && isTurnTailCard(payload)) {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      ToolResultArtifact,
      {
        payload,
        openFile,
        openPreview,
        callId: block.callId,
        useChat: props.useChat ?? noChat,
        t
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ArtifactCard, { payload, openFile, openPreview, t });
}
function LoginCard({ payload, t }) {
  const [challenge, setChallenge] = (0, import_react4.useState)();
  const [busy, setBusy] = (0, import_react4.useState)();
  const [notice, setNotice] = (0, import_react4.useState)();
  const [error, setError] = (0, import_react4.useState)();
  const [signedIn, setSignedIn] = (0, import_react4.useState)(false);
  const [expiredAt, setExpiredAt] = (0, import_react4.useState)(0);
  const login = challenge ?? payload;
  const site = login.base_url && URL.canParse(login.base_url) ? new URL(login.base_url).host : void 0;
  const expiresAt = login.expires_at ?? 0;
  const tokenRejected = error === "fixedTokenRejected";
  const href = !tokenRejected && expiresAt > Math.max(expiredAt, Date.now()) ? authorizationUrl(login) : void 0;
  (0, import_react4.useEffect)(() => {
    if (!href) return;
    const expiry = setTimeout(() => setExpiredAt(expiresAt), Math.max(0, expiresAt - Date.now()));
    return () => clearTimeout(expiry);
  }, [href, expiresAt]);
  async function act(action) {
    setBusy(action);
    setError(void 0);
    setNotice(void 0);
    try {
      const response = await fetch("/api/cheso/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, site: login.base_url })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result) {
        switch (result?.code) {
          case "unknown_cheso_site":
            setError("loginUnknownSite");
            break;
          case "fixed_token_rejected":
            setError("fixedTokenRejected");
            break;
          case "login_expired":
            setExpiredAt(expiresAt);
            break;
          case "login_denied":
          case "login_incomplete":
            setExpiredAt(expiresAt);
            setError(result.code === "login_denied" ? "loginDenied" : "loginIncomplete");
            break;
          default:
            setError("loginFailed");
        }
        return;
      }
      if (result.status === "login_pending" && authorizationUrl(result)) {
        setChallenge(result);
      } else if (result.status === "signed_in") {
        setSignedIn(true);
      } else if (result.status === "waiting") {
        setNotice("loginWaiting");
      } else if (result.status === "login_required") {
        setNotice("loginNotStarted");
        setExpiredAt(expiresAt);
      } else {
        setError("loginInvalidLink");
      }
    } catch {
      setError("loginFailed");
    } finally {
      setBusy(void 0);
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: styles3.card, "data-tool": "cheso-login", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: styles3.head, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: styles3.dot }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: styles3.title, children: t("loginTitle") }),
      site ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: styles3.status, children: site }) : null
    ] }),
    signedIn ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { role: "status", children: t("loginSignedIn") }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
      !(error && !href) ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { children: t(href ? "loginInstructions" : expiresAt ? "loginExpired" : "loginRequired") }) : null,
      href && login.user_code ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
        t("loginEnterCode"),
        " ",
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("code", { children: login.user_code })
      ] }) : null,
      !tokenRejected ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }, children: href ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("a", { href, target: "_blank", rel: "noopener noreferrer", style: { ...styles3.button, textDecoration: "none" }, children: t("loginAuthorize") }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", style: styles3.button, disabled: !!busy, onClick: () => void act("check"), children: t(busy === "check" ? "loginChecking" : "loginCheck") })
      ] }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", style: styles3.button, disabled: !!busy, onClick: () => void act("start"), children: t(busy === "start" ? "loginGettingLink" : expiresAt ? "loginGetNewLink" : "loginGetLink") }) }) : null,
      notice ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { role: "status", style: { marginTop: 6 }, children: t(notice) }) : null,
      error ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { role: "alert", style: { ...styles3.error, marginTop: 6 }, children: t(error) }) : null
    ] })
  ] });
}
function ArtifactCard({ payload, openFile, openPreview, t }) {
  if (isLoginCard(payload)) return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(LoginCard, { payload, t });
  const status = payload.status ?? "running";
  const artifacts = payload.artifacts ?? [];
  const scrollable = artifacts.length > MAX_VISIBLE_ARTIFACT_ROWS;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: styles3.card, "data-tool": "cheso", "data-status": status, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: styles3.head, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { ...styles3.dot, background: status === "failed" ? "#dc2626" : "#3b82f6" } }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: styles3.title, children: payload.project_url ? t("artifacts") : payload.task_id ? t("taskId", { id: payload.task_id }) : t("task") }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: styles3.status, children: statusLabel(t, status, artifacts.length) })
    ] }),
    payload.message && status !== "insufficient_credits" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: status === "interact" || status === "queued" ? styles3.message : styles3.error, children: payload.message }) : null,
    artifacts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      "div",
      {
        style: scrollable ? styles3.scrollableList : void 0,
        tabIndex: scrollable ? 0 : void 0,
        role: scrollable ? "region" : void 0,
        "aria-label": scrollable ? t("fileList") : void 0,
        children: artifacts.map((artifact, index) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          ArtifactRow,
          {
            artifact,
            payload,
            openFile,
            openPreview,
            t
          },
          `${artifact.file_id ?? artifact.name}-${index}`
        ))
      }
    ),
    payload.project_url ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { marginTop: 6 }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("a", { href: payload.project_url, target: "_blank", rel: "noreferrer", style: styles3.link, children: t("openInCheso") }) }) : null
  ] });
}
function statusLabel(t, status, count) {
  if (status === "queued") return t("taskQueued");
  if (ACTIVE_TASK_STATUSES.has(status)) return t("taskRunning");
  switch (status) {
    case "completed":
      return t("taskCompleted", { count });
    case "insufficient_credits":
      return t("lowCredits");
    case "failed":
      return t("taskFailed");
    case "terminated":
      return t("taskStopped");
    case "rolled_back":
      return t("taskRolledBack");
    case "interact":
      return t("taskNeedsReply");
    case "unknown":
      return t("taskUnknown");
    default:
      return status;
  }
}
function ArtifactRow({ artifact, payload, openFile, openPreview, t }) {
  const [previewError, setPreviewError] = (0, import_react4.useState)(false);
  const { file_id: fileId, format, path } = artifact;
  const canPreview = fileId && (payload.project_url || payload.embed_base_url) && isEmbedFormat(format);
  const fileUrl = fileId ? chesoFileUrl(payload.project_url, fileId) : void 0;
  const localPath = path && /^(?:\/|[A-Za-z]:[\\/]|\\\\)/.test(path) ? path : void 0;
  const handlePreview = () => {
    try {
      openPreview(artifact, payload);
      setPreviewError(false);
    } catch {
      setPreviewError(true);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: styles3.row, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(FileIcon, { format }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: styles3.name, title: artifact.path ?? artifact.name, children: artifact.name }),
      artifact.category === "result" ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: styles3.resultBadge, children: t("resultBadge") }) : null,
      canPreview ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", style: styles3.button, onClick: handlePreview, children: t("preview") }) : fileUrl ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("a", { href: fileUrl, target: "_blank", rel: "noreferrer", style: { ...styles3.button, textDecoration: "none" }, children: t("openInCheso") }) : localPath ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("button", { type: "button", style: styles3.button, onClick: () => openFile(localPath), children: t("open") }) : null
    ] }),
    previewError ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { role: "alert", style: styles3.error, children: t("previewOpenFailed") }) : null
  ] });
}
function questionReceiptsOf(meta) {
  if (!meta || typeof meta !== "object" || !("cheso_question_receipts" in meta)) return;
  const receipts = meta.cheso_question_receipts;
  if (Array.isArray(receipts) && receipts.length && receipts.every(
    (receipt) => Array.isArray(receipt?.answers) && receipt.answers.every(
      (answer) => typeof answer?.label === "string" && Array.isArray(answer.values) && (answer.question === void 0 || typeof answer.question === "string") && answer.values.every((value) => typeof value === "string")
    )
  )) return receipts;
}
function settledQuestion(event) {
  return {
    active: false,
    receipts: event?.type === "tool/result" || event?.type === "tool/ptc-dispatch" ? questionReceiptsOf(event.data.meta) : void 0
  };
}
var questionTimelineDefinition = {
  kind: QUESTION_TIMELINE_KIND,
  target: "chat",
  match(event) {
    if (event.type === "tool/call" && event.data.name === "cheso_wait") {
      return { id: event.data.callId, role: "start" };
    }
    if (event.type === "tool/result" && event.surfaceOp === "append") {
      return { id: event.data.message.source.callId, role: "update" };
    }
    if ((event.type === "tool/ptc-dispatch-start" || event.type === "tool/ptc-dispatch") && event.data.name === "cheso_wait") {
      return { id: event.data.subCallId, role: event.type === "tool/ptc-dispatch-start" ? "start" : "update" };
    }
    return null;
  },
  start() {
    return { active: true };
  },
  update(_context, { event }) {
    return settledQuestion(event);
  },
  buildViewNode({ key, id, start, matches, state, current }) {
    const anchor = start ?? matches[0];
    if (!anchor) return null;
    const { event, location } = anchor;
    const { active, receipts } = state ?? settledQuestion(event);
    const running = active && !(location.kind === "step" && location.step.status === "closed") && !((location.kind === "step" || location.kind === "turn") && location.turn.status === "closed");
    if (!running && !receipts) {
      const previous = current.get("chat");
      return previous ? { ...previous, visibility: "hidden" } : null;
    }
    return {
      key,
      id,
      target: "chat",
      kind: QUESTION_TIMELINE_KIND,
      location,
      anchorSeq: event.seq + 0.1,
      groupTree: "turn",
      visibility: "visible",
      data: { active: running, receipts }
    };
  }
};
function questionTrajectoryDefinition(t) {
  return {
    kind: QUESTION_TRAJECTORY_KIND,
    target: "trajectory",
    match(event) {
      if (event.type !== "tool/result" && event.type !== "tool/ptc-dispatch") return null;
      if (event.type === "tool/result" ? event.surfaceOp !== "append" : event.data.name !== "cheso_wait") return null;
      return questionReceiptsOf(event.data.meta) ? { id: String(event.seq), role: "start" } : null;
    },
    start(_context, { event }) {
      return settledQuestion(event).receipts;
    },
    update({ state }) {
      return state;
    },
    buildViewNode({ key, id, start, state }) {
      if (!start || !state?.length || !("time" in start.event)) return null;
      const { seq, time } = start.event;
      const text = state.map(({ answers }, index) => [
        `Cheso \xB7 ${t("questionRound", { number: index + 1 })}`,
        ...answers.map(({ label, question, values }) => `${question ?? label}: ${values.length ? values.join(", ") : t("questionSkipped")}`)
      ].join("\n")).join("\n\n");
      return {
        key,
        id,
        kind: QUESTION_TRAJECTORY_KIND,
        target: "trajectory",
        location: start.location,
        anchorSeq: seq,
        data: { kind: "node", node: {
          kind: "context",
          seq,
          time,
          content: [{ type: "text", text }],
          source: { kind: "plugin", plugin: "dsh-cheso-design" },
          producer: { role: "inject", label: "Cheso" },
          form: null
        } }
      };
    }
  };
}
function WaitQuestions({ node, t }) {
  const { active, receipts } = node.data;
  const activity = useQuestionActivity(active ? node.id : void 0);
  const previews = active ? activity.previews : null;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(QuestionReceipts, { receipts: active ? activity.receipts : receipts, t }),
    previews?.length ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: styles3.card, "data-cheso-question-previews": "", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(QuestionPreviews, { previews }) }) : null
  ] });
}
function isProjectListing(payload) {
  return payload.status === "completed" && !!payload.project_id && !payload.task_id;
}
function isTurnTailCard(payload) {
  return payload.status === "terminated" || !!payload.artifacts?.length || isProjectListing(payload);
}
function cardTaskSite(payload) {
  return payload.base_url || projectSite(payload.project_url);
}
function artifactCardKey(payload, callId) {
  if (payload.status === "completed" && payload.project_url) {
    const files = [...new Set(payload.artifacts?.map((file) => file.file_id ?? file.name))].sort();
    return JSON.stringify([payload.project_url, files]);
  }
  if (payload.task_id) return JSON.stringify([cardTaskSite(payload), payload.task_id]);
  return payload.project_id ?? callId;
}
var artifactTurnDefinition = {
  kind: ARTIFACTS_TURN_KEY,
  /** 识别需要纳入回合状态的工具调用或持久化结果。 */
  match(event) {
    if (event.type === "tool/call" && CARD_TOOLS.includes(event.data.name)) {
      return { id: String(event.data.turn), role: "start" };
    }
    if (event.type === "tool/result" && event.surfaceOp === "append" && parseCard(event.data.message)) {
      return { id: String(event.data.turn), role: "start" };
    }
    return null;
  },
  /** 初始化回合内的工具调用和卡片。 */
  start(_context, { event }) {
    return {
      callIds: new Set(event.type === "tool/call" ? [event.data.callId] : []),
      cards: /* @__PURE__ */ new Map()
    };
  },
  /** 将工具事件归入当前回合，并对登录卡和产物卡去重。 */
  update({ state }, { event }) {
    if (event.type === "tool/call") {
      return { ...state, callIds: /* @__PURE__ */ new Set([...state.callIds, event.data.callId]) };
    }
    if (event.type !== "tool/result") return state;
    const { message } = event.data;
    if (!state.callIds.has(message.source.callId)) return state;
    if (message.isError) return state;
    const payload = parseCard(message);
    if (!payload) return state;
    const callId = message.source.callId;
    const card = { callId, payload };
    const loginKey = `login:${payload.base_url ?? ""}`;
    if (isLoginCard(payload)) {
      if (payload.status === "login_required" && state.cards.get(loginKey)?.payload.status === "login_pending") return state;
      return { ...state, cards: new Map(state.cards).set(loginKey, card) };
    }
    const isActiveTask = payload.task_id && payload.status && ACTIVE_TASK_STATUSES.has(payload.status);
    if (!isTurnTailCard(payload) && !(isActiveTask && payload.project_url)) return state;
    const key = artifactCardKey(payload, callId);
    return { ...state, cards: new Map(state.cards).set(key, card) };
  },
  /** 将非空状态发布到回合位置，并复用未变化的视图数据。 */
  buildLocationData({ id, state }, scope, previous) {
    if (scope !== "turn" || !state?.cards.size) return null;
    if (previous?.value === state) return previous;
    return { kind: "turn", turn: Number(id), key: ARTIFACTS_TURN_KEY, value: state };
  }
};
function TurnArtifacts({ turn, openFile, openPreview, t }) {
  const state = turn.data.get(ARTIFACTS_TURN_KEY);
  if (!state) return null;
  return Array.from(state.cards, ([key, { payload }]) => {
    if (payload.task_id && payload.status && ACTIVE_TASK_STATUSES.has(payload.status) && !payload.artifacts?.length) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ArtifactCard, { payload, openFile, openPreview, t }, key);
  });
}
function savedPreview(address) {
  try {
    const raw = localStorage.getItem(PREVIEW_STORAGE_PREFIX + address);
    if (!raw) return;
    const params = JSON.parse(raw);
    if (!params) return;
    const { file_id, name, format, project_url, embed_base_url } = params;
    if (typeof file_id !== "string" || typeof name !== "string" || typeof format !== "string" || project_url !== void 0 && typeof project_url !== "string" || embed_base_url !== void 0 && typeof embed_base_url !== "string") return;
    const siteUrl = project_url || embed_base_url;
    if (file_id && siteUrl && previewAddress(siteUrl, file_id) === address) {
      return { file_id, name, format, project_url, embed_base_url };
    }
  } catch {
  }
}
function previewAddress(siteUrl, fileId) {
  const site = new URL(siteUrl).origin;
  return `${RESOURCE_PREFIX}${encodeURIComponent(site)}/${encodeURIComponent(fileId)}`;
}
var PreviewError = class extends Error {
  constructor(key, params) {
    super(key);
    this.key = key;
    this.params = params;
  }
};
async function requestContent({ file_id, project_url, embed_base_url }, signal, version) {
  const query = new URLSearchParams({ file_id });
  if (version) query.set("version", String(version));
  if (project_url) query.set("project_url", project_url);
  if (embed_base_url) query.set("embed_base_url", embed_base_url);
  const response = await fetch(`/api/cheso/preview?${query.toString()}`, { signal, cache: "no-store" });
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    if (result?.error === "cheso_login_required") throw new PreviewError("previewLoginRequired");
    if (result?.error === "fixed_token_rejected") throw new PreviewError("fixedTokenRejected");
    if (result?.error === "cheso_file_forbidden") throw new PreviewError("previewForbidden");
    if (result?.error === "unknown_cheso_site") throw new PreviewError("previewUnknownSite");
    if (response.status === 401) throw new PreviewError("previewSessionExpired");
    throw new PreviewError("previewUrlRequestFailed", { status: response.status });
  }
  const data = await response.json();
  if (!data || typeof data.preview_session !== "string" || !data.preview_session) {
    throw new PreviewError("previewLoadFailed");
  }
  return data;
}
function previewFileName(t, params) {
  return params?.name?.split(/[\\/]/).pop() || params?.file_id || t("previewTitle");
}
function PreviewTitle({ useTabInfo, t }) {
  const { tab } = useTabInfo();
  const { address, params } = tab.navigation;
  const fileName = previewFileName(t, params ?? savedPreview(address));
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { title: fileName, children: fileName });
}
function PreviewBody({ useTabInfo, t }) {
  const { tab } = useTabInfo();
  const { address, revision } = tab.navigation;
  const params = tab.navigation.params ?? savedPreview(address);
  if (!params) return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { role: "status", style: { padding: 16 }, children: t("previewReopen") });
  const fileName = previewFileName(t, params);
  const fileUrl = chesoFileUrl(params.project_url, params.file_id);
  const content = isEmbedFormat(params.format) ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ChesoPreviewFrame, { params, revision, t }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { padding: 16 }, children: t("previewUnsupported") });
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: styles3.preview, children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("header", { style: styles3.previewHeader, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: styles3.previewFileName, title: params.name, children: fileName }),
      fileUrl ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
        "a",
        {
          href: fileUrl,
          target: "_blank",
          rel: "noreferrer",
          style: { ...styles3.button, color: "inherit", textDecoration: "none", whiteSpace: "nowrap" },
          children: t("editInCheso")
        }
      ) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: styles3.previewBody, children: content })
  ] });
}
function chesoFileUrl(projectUrl, fileId) {
  if (!projectUrl) return void 0;
  try {
    const url = new URL(projectUrl);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return void 0;
    if (fileId) {
      url.searchParams.set("file", fileId);
      url.searchParams.delete("version");
    }
    return url.href;
  } catch {
    return void 0;
  }
}
function ChesoPreviewFrame({ params, revision, t }) {
  const iframeRef = (0, import_react4.useRef)(null);
  const readyRef = (0, import_react4.useRef)(false);
  const contentRef = (0, import_react4.useRef)(null);
  const [error, setError] = (0, import_react4.useState)();
  const [embedUrl, setEmbedUrl] = (0, import_react4.useState)("");
  const embedOrigin = embedUrl ? new URL(embedUrl).origin : "";
  const { file_id, project_url, embed_base_url } = params;
  const bindFrame = (0, import_react4.useCallback)((frame) => {
    iframeRef.current = frame;
    readyRef.current = false;
  }, []);
  const sendLoad = (0, import_react4.useCallback)(() => {
    const frame = iframeRef.current;
    const content = contentRef.current;
    if (!frame?.contentWindow || !content || !readyRef.current) return;
    frame.contentWindow.postMessage(
      {
        type: "cheso.preview.load",
        preview_session: content.preview_session
      },
      new URL(content.embed_url).origin
    );
  }, []);
  const fetchContent = (0, import_react4.useCallback)(async (signal, version) => {
    const data = await requestContent({ file_id, project_url, embed_base_url }, signal, version);
    if (!URL.canParse(data.embed_url) || !/^https?:$/.test(new URL(data.embed_url).protocol)) {
      throw new PreviewError("previewInvalidEmbedUrl");
    }
    return data;
  }, [file_id, project_url, embed_base_url]);
  const updateContent = (0, import_react4.useCallback)((data, refreshExpired = false) => {
    const previous = contentRef.current;
    contentRef.current = data;
    if (previous?.embed_url !== data.embed_url) {
      setEmbedUrl(data.embed_url);
    } else if (refreshExpired || data.version === void 0 || previous.version !== data.version) {
      sendLoad();
    }
  }, [sendLoad]);
  (0, import_react4.useEffect)(() => {
    const controller = new AbortController();
    setError(void 0);
    fetchContent(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) updateContent(data);
      },
      (reason) => {
        if (!controller.signal.aborted) setError(reason instanceof PreviewError ? reason : new PreviewError("previewLoadFailed"));
      }
    );
    return () => controller.abort();
  }, [fetchContent, revision, updateContent]);
  (0, import_react4.useEffect)(() => {
    if (!embedOrigin || error) return;
    const controller = new AbortController();
    let requesting = false;
    const refresh = () => {
      if (requesting) return;
      requesting = true;
      const previous = contentRef.current;
      const stillCurrent = () => !controller.signal.aborted && previous === contentRef.current;
      fetchContent(controller.signal, previous?.version).then(
        (next) => {
          if (stillCurrent()) updateContent(next, true);
        },
        (reason) => {
          if (stillCurrent()) setError(reason instanceof PreviewError ? reason : new PreviewError("previewLoadFailed"));
        }
      ).finally(() => {
        requesting = false;
      });
    };
    const readyTimeout = readyRef.current ? void 0 : setTimeout(() => setError(new PreviewError("previewTimedOut")), 1e4);
    const onMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.origin !== embedOrigin) return;
      const data = event.data;
      if (data?.type === "cheso.preview.ready") {
        readyRef.current = true;
        clearTimeout(readyTimeout);
        sendLoad();
      } else if (data?.type === "cheso.preview.expired") {
        refresh();
      } else if (data?.type === "cheso.preview.error") {
        setError(typeof data.message === "string" && data.message ? data.message : new PreviewError("previewLoadFailed"));
      }
    };
    window.addEventListener("message", onMessage);
    return () => {
      controller.abort();
      clearTimeout(readyTimeout);
      window.removeEventListener("message", onMessage);
    };
  }, [embedUrl, embedOrigin, error, sendLoad, fetchContent, updateContent]);
  if (error) {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { padding: 16, fontSize: 13, lineHeight: 1.6 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: styles3.error, children: typeof error === "string" ? error : t(error.key, error.params) }),
      params.file_id ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { style: { marginTop: 12, opacity: 0.75 }, children: t("previewFileStored", { name: params.name ?? params.file_id }) }) : null
    ] });
  }
  if (!embedUrl) {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { role: "status", style: { display: "grid", height: "100%", placeContent: "center", opacity: 0.7 }, children: t("previewLoading") });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    "iframe",
    {
      ref: bindFrame,
      title: params.name ?? t("previewTitle"),
      src: embedUrl,
      sandbox: "allow-scripts allow-same-origin allow-forms allow-popups allow-downloads",
      allow: "fullscreen; autoplay",
      referrerPolicy: "no-referrer",
      style: { width: "100%", height: "100%", border: 0, display: "block" }
    },
    embedUrl
  );
}
function ensureStyles() {
  const id = "dsh-cheso-design-style";
  if (document.getElementById(id)) return () => {
  };
  const style = document.createElement("style");
  style.id = id;
  style.dataset.plugin = "dsh-cheso-design";
  style.textContent = [
    ".cheso-hidden{display:none}",
    // Match the DSH detail document's height limit so the gallery fits shorter windows.
    '[data-detail-document] img[src*="path=previews%2Fcheso-gallery-"]{max-height:min(560px,60vh);margin-inline:auto}',
    ".cheso-account-primary{background:var(--dsw-alias-button-primary-fill,var(--dsw-alias-brand-primary,#2563eb));color:var(--dsw-alias-label-primary-foreground,var(--dsw-alias-label-primary-inverted,#fff))}",
    ".cheso-account-secondary{box-sizing:border-box;height:28px;padding:0 10px;border:.5px solid var(--dsw-alias-border-l2,rgba(127,127,127,.3));border-radius:var(--dsw-radius-sm,8px);background:transparent;color:var(--dsw-alias-label-primary,inherit);font-family:inherit;font-size:12px;line-height:18px;cursor:pointer}",
    ".cheso-account-primary,.cheso-account-secondary{transition:background-color .15s ease}",
    ".cheso-account-primary:disabled,.cheso-account-secondary:disabled{opacity:.6;cursor:default}",
    ".cheso-account-primary:focus-visible,.cheso-account-secondary:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#3b82f6);outline-offset:2px}",
    "@media(hover:hover){",
    ".cheso-account-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,#1d4ed8)}",
    ".cheso-account-secondary:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.08))}",
    "}"
  ].join("");
  document.head.appendChild(style);
  return () => style.remove();
}
function apply(ctx) {
  const t = ctx.locale.bind(localeNamespace);
  const settings = ctx.configForms.get("cheso");
  ctx.effect(() => ctx.locale.register(localeNamespace, dictionaries), "cheso: dictionaries");
  ctx.effect(() => ensureStyles(), "cheso:styles");
  ctx.slots.inject(
    "plugins.bundle.config",
    () => ctx.slots.register({ name: "plugins.bundle.config", key: "dsh-cheso-design", locale: localeNamespace }, (props) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ChesoSettings, { ...props, form: settings }))
  );
  const openPreview = (artifact, payload) => {
    const siteUrl = payload.project_url || payload.embed_base_url;
    if (!artifact.file_id || !siteUrl) return;
    const address = previewAddress(siteUrl, artifact.file_id);
    const params = {
      file_id: artifact.file_id,
      name: artifact.name,
      format: artifact.format,
      embed_base_url: payload.embed_base_url,
      project_url: payload.project_url
    };
    try {
      localStorage.setItem(PREVIEW_STORAGE_PREFIX + address, JSON.stringify(params));
    } catch {
    }
    ctx.sidebarRight.openResource(address, { kind: TAB_KIND, params });
  };
  for (const tool of CARD_TOOLS) {
    ctx.slots.inject(
      "tool.call.toolview",
      () => ctx.slots.register({ name: "tool.call.toolview", key: tool, locale: localeNamespace }, (props) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(ToolCard, { ...props, toolName: tool, openPreview }))
    );
  }
  ctx.slots.inject(
    "conversation.input.dock",
    () => ctx.slots.register({ name: "conversation.input.dock", id: WAIT_PROGRESS_DOCK, locale: localeNamespace }, WaitProgressDock)
  );
  ctx.uiConversation.events.register(questionTimelineDefinition);
  ctx.uiConversation.events.register(questionTrajectoryDefinition(t));
  ctx.slots.inject(
    "conversation.chat.node",
    () => ctx.slots.register({ name: "conversation.chat.node", key: QUESTION_TIMELINE_KIND, locale: localeNamespace }, WaitQuestions)
  );
  ctx.uiConversation.events.register(artifactTurnDefinition);
  ctx.slots.inject(
    "conversation.chat.turnTail",
    () => ctx.slots.register({ name: "conversation.chat.turnTail", id: ARTIFACTS_TURN_KEY, locale: localeNamespace }, (props) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(TurnArtifacts, { ...props, openPreview }))
  );
  ctx.effect(() => ctx.sidebarRightTabs.register({
    id: TAB_ID,
    kind: TAB_KIND,
    patterns: [`${RESOURCE_PREFIX}**`],
    // 切到其他标签时保留 iframe，避免回来时丢失当前预览位置。
    keepMounted: true,
    title: (address) => previewFileName(t, savedPreview(address))
  }), "cheso:tab");
  ctx.slots.inject(
    "sidebar.right.pane.tab",
    () => ctx.slots.register({ name: "sidebar.right.pane.tab", key: TAB_ID, locale: localeNamespace }, PreviewBody)
  );
  ctx.slots.inject(
    "sidebar.right.pane.tab.title",
    () => ctx.slots.register({ name: "sidebar.right.pane.tab.title", key: TAB_ID, locale: localeNamespace }, PreviewTitle)
  );
}
    return module.exports;
  }
});
//# sourceMappingURL=client.js.map
