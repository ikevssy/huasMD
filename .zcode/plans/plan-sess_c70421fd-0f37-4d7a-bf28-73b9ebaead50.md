# v0.1.6 完整修复 + 新增3主题

## 🔴 致命BUG（崩溃）
1. 删除重复 `check-update` IPC (line 937-949)
2. 删除重复 `install-update` IPC (line 951-956)

## 🔴 功能BUG
3. template.html `mergeBlocks()` 跳过指令行（修复后幻灯片不再显示乱文本）
4. 全宽切换 localStorage key 统一为 `'huasmd-width'`
5. TOC 选择器 `h2-h6` 加 `#editor .ProseMirror` 作用域
6. 更新点击改用 status 变量，不用文本匹配

## 🟡 代码质量
7. preload 补全 `onMenuImportTheme` 类型声明
8. 应用菜单 Theme 子菜单列出全部 9 主题
9. 自定义主题启动时不重复调用 applyTheme
10. 更新提示去硬编码中文，改用 i18n
11. 清理无用 i18n keys
12. 删除 `onNewFile` 死代码
13. 主题弹窗不再 setTimeout 刷新

## 🎨 新增3个主题
14. **暮光 / Ayu Light** — 暖橙强调，柔和暖灰底色
15. **灰羽 / Gandalf** — 玫瑰红强调，灰调内敛
16. **暖樱 / Rose Duotone** — 粉紫双色调，温柔浪漫