# asset-tools

这里存知识库资产治理相关脚本。

第一阶段建议提供：

1. `create-manifest.mjs`
 - 为组件或页面生成 manifest
2. `validate-asset-compatibility.mjs`
 - 校验依赖是否超出 `project-mamba`
3. `promote-asset.mjs`
 - 把资产从 candidate 晋升到 official 或其他目标状态
4. `sync-asset-to-project.mjs`
 - 基于 manifest 执行受控同步
5. `collect-writeback-items.mjs`
 - 汇总 manifest 中的 docs / standards / examples / agents 回写项
6. `sync-candidate-to-hashrate-preview.mjs`
 - 将知识库候选组件复制到 `hashrate` 的本地 `__preview__` 验证区
7. `sync-page-draft-to-hashrate-preview.mjs`
 - 将知识库候选页面草稿复制到 `hashrate` 的本地 `__preview__` 页面验证区

这些脚本默认操作 `E:\work\ai-web-system\assets`，并以 `project-mamba/package.json`作为依赖基线之一。
