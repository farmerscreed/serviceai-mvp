  GET http://localhost:3000/settings 500 (Internal Server Error)
processMessage @ webpack-internal:///…reloader-app.js:295
handler @ webpack-internal:///…reloader-app.js:407Understand this error
main.js:1431 Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
index.js:640 Uncaught ModuleBuildError: Module build failed (from ./node_modules/next/dist/build/webpack/loaders/next-swc-loader.js):
Error:   × Expected ';', got 'import'
    ╭─[F:\APPS\ServiceAI\app\settings\page.tsx:18:1]
 15 │     BellRing, 
 16 │     MessageSquare, 
 17 │     Bot 
 18 │   } from 'lucide-react'import { cn } from '@/lib/utils'
    ·                        ──────
 19 │ 
 20 │ interface SettingCard {
 20 │   id: string
    ╰────


Caused by:
    Syntax Error
    at processResult (file://F:\APPS\ServiceAI\node_modules\next\dist\compiled\webpack\bundle5.js:29:407086)
    at <unknown> (file://F:\APPS\ServiceAI\node_modules\next\dist\compiled\webpack\bundle5.js:29:408881)
    at <unknown> (file://F:\APPS\ServiceAI\node_modules\next\dist\compiled\loader-runner\LoaderRunner.js:1:8645)
    at <unknown> (file://F:\APPS\ServiceAI\node_modules\next\dist\compiled\loader-runner\LoaderRunner.js:1:5019)
    at r.callback (file://F:\APPS\ServiceAI\node_modules\next\dist\compiled\loader-runner\LoaderRunner.js:1:4039)
getServerError @ node-stack-frames.js:41
eval @ index.js:640
setTimeout
hydrate @ index.js:618
await in hydrate
pageBootstrap @ page-bootstrap.js:28
eval @ next-dev.js:24
Promise.then
eval @ next-dev.js:22
(pages-dir-browser)/./node_modules/next/dist/client/next-dev.js @ main.js:314
options.factory @ webpack.js:1
__webpack_require__ @ webpack.js:1
__webpack_exec__ @ main.js:1546
(anonymous) @ main.js:1547
webpackJsonpCallback @ webpack.js:1
(anonymous) @ main.js:9Understand this error
websocket.js:46 [HMR] connected
pages-dev-overlay-setup.js:77 ./app/settings/page.tsx
Error:   × Expected ';', got 'import'
    ╭─[F:\APPS\ServiceAI\app\settings\page.tsx:18:1]
 15 │     BellRing, 
 16 │     MessageSquare, 
 17 │     Bot 
 18 │   } from 'lucide-react'import { cn } from '@/lib/utils'
    ·                        ──────
 19 │ 
 20 │ interface SettingCard {
 20 │   id: string
    ╰────

Caused by:
    Syntax Error