# Shared Session Storage

[DEMO](https://live-demo.github.io/shared-session-storage/index.html)

## 原因

假设有这么一个需求：需要临时保存一些数据，可以在多个 tab/window 中共享，当所有的页面关闭后，可以自动销毁这些数据。

首先可能会想到是 cookie，但由于 cookie 会在请求时将数据发送到服务器，因此这里不考虑它了。

接着就是 sessionStorage 和 localStorage 这两个 API 了。

sessionStorage 一般用于保存临时数据，只有在关闭页面，退出浏览器时，才会销毁这些数据，刷新这个页面并不会丢失数据。

但 sessionStorage 有个比较大的缺点，如果同时打开多个页面，这些页面之间无法共享数据。

如果需要共享数据，网络上一般会推荐使用 localStorage。确实，localStorage 可以在多个页面中共享数据，但由于 localStorage 保存的数据是永久的，而上面的需求需要的只是临时保存而已。

由于无法找到其他更好的 API 了，而 sessionStorage 和 localStorage 又同时满足上面需求的一部分，因此这里打算将其封装一下。

刚开始时，打算只有 localStorage，然后当浏览器关闭后手动来销毁这些临时数据，但在深入分析后，发现实现起来比较麻烦。

于是就使用 sessionStorage 来保存数据，然后使用 localStorage 同步这些数据作为最终的方案了（在同步数据时，有想过使用其他的 API，比如 SharedWorker、MessageChannel、BroadcastChannel 等，但由于兼容性的原因，最终选择 localStorage + storage 事件来实现同步）。


## 安装

```shell
npm install --save shared-session-storage
```

## 使用方式


ES6 module

```javascript
import sharedSessionStorage from "shared-session-storage";

// API like sessionStorage and localStorage
```

Load js file

```html
<script src=".../shared-session-storage/dist/index.js"></script>
<script>
    // window.sharedSessionStorage
</script>
```


## 已知问题

当前已知有一个问题，当一个 TabA 里保存一些临时数据，在其关闭后，接着打开 TabB，这里在 TabB 里又保存新的一些临时数据。如果这里重新恢复打开 TabA，会导致 TabA 与 TabB 的数据不一致。
