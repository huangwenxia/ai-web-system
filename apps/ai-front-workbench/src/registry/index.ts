import { generatedAssetRegistry } from './generated/asset-registry.generated'
import type {
 WorkbenchAssetCompositionLink,
 WorkbenchAssetEntry,
 WorkbenchAssetImplementationStrategy,
 WorkbenchAssetType,
} from './types'

export const assetRegistry = generatedAssetRegistry

const IMPLEMENTATION_LABELS: Record<WorkbenchAssetImplementationStrategy, string> = {
 'project-component': '真实组件基线',
 'asset-composed': '组件装配页面',
 mixed: '组件装配 + 原生补位',
 'native-fallback': '原生 fallback',
 'pattern-primitive': '模式原语',
}

export function getAssetKey(type: WorkbenchAssetType, name: string) {
 return `${type}:${name}`
}

export function getAssetByRoute(type: string, name: string) {
 return assetRegistry.find((asset) => asset.type === type && asset.name === name) ?? null
}

export function getAssetById(id: string) {
 return assetRegistry.find((asset) => asset.id === id) ?? null
}

export function getAssetDisplayNameById(id: string) {
 return getAssetById(id)?.name ?? id
}

export function getAssetTypeLabel(type: WorkbenchAssetType) {
 switch (type) {
  case 'component':
   return '组件'
  case 'page':
   return '页面'
  case 'pattern':
   return '模式'
  default:
   return type
 }
}

export function getAssetImplementationLabel(asset: WorkbenchAssetEntry) {
 return IMPLEMENTATION_LABELS[asset.implementation.strategy] ?? asset.implementation.strategy
}

export function getAssetComposedAssetLabels(asset: WorkbenchAssetEntry) {
 return asset.composition.composedOf.map((item) => {
  const assetName = getAssetDisplayNameById(item.assetId)
  return item.role ? `${assetName} (${item.role})` : assetName
 })
}

export function getAssetCompositionSummary(asset: WorkbenchAssetEntry) {
 const summary: string[] = []

 if (asset.type === 'page') {
  if (asset.composition.composedOf.length) {
   summary.push(`装配组件: ${getAssetComposedAssetLabels(asset).join(', ')}`)
  } else {
   summary.push('尚未声明页面装配组件')
  }

  if (asset.implementation.fallbackHtmlBlocks.length) {
   summary.push(`原生补位: ${asset.implementation.fallbackHtmlBlocks.join(', ')}`)
  }

  if (asset.composition.missingCapabilities.length) {
   summary.push(`待沉淀组件: ${asset.composition.missingCapabilities.join(', ')}`)
  }
 } else {
  summary.push(asset.implementation.realComponentRefs ? '真实依赖引用已对齐' : '真实依赖引用待对齐')

  if (asset.composition.composedOf.length) {
   summary.push(`内部装配: ${getAssetComposedAssetLabels(asset).join(', ')}`)
  }
 }

 if (asset.implementation.notes) {
  summary.push(`实现说明: ${asset.implementation.notes}`)
 }

 if (asset.composition.notes) {
  summary.push(`装配说明: ${asset.composition.notes}`)
 }

 return summary
}

export function getAssetQueueReasons(asset: WorkbenchAssetEntry) {
 const reasons: string[] = []

 if (asset.type === 'page' && asset.implementation.strategy === 'native-fallback') {
  reasons.push('页面仍是原生 fallback，尚未进入组件装配层')
 }

 if (asset.type === 'page' && asset.implementation.fallbackHtmlBlocks.length) {
  reasons.push(`仍有原生区块待抽离: ${asset.implementation.fallbackHtmlBlocks.join(', ')}`)
 }

 if (asset.composition.missingCapabilities.length) {
  reasons.push(`缺少可复用资产: ${asset.composition.missingCapabilities.join(', ')}`)
 }

 if (asset.type === 'component' && !asset.implementation.realComponentRefs) {
  reasons.push('组件实现还没有对齐真实 project-mamba 依赖引用')
 }

 if (!asset.preview.integrationRoute && asset.status !== 'draft') {
  reasons.push('尚未接入集成预览')
 }

 if (!reasons.length) {
  reasons.push('等待继续补边界、补评审或进入同步链路')
 }

 return reasons
}

export function getAssetReviewSummary(asset: WorkbenchAssetEntry) {
 const summary: string[] = []

 if (asset.review.reusability) {
  summary.push(`复用性: ${asset.review.reusability}`)
 }
 if (asset.review.apiStability) {
  summary.push(`API: ${asset.review.apiStability}`)
 }
 if (asset.review.visualQuality) {
  summary.push(`视觉: ${asset.review.visualQuality}`)
 }
 if (asset.review.structureQuality) {
  summary.push(`结构: ${asset.review.structureQuality}`)
 }
 if (asset.review.boundaryCompleteness) {
  summary.push(`边界: ${asset.review.boundaryCompleteness}`)
 }
 if (asset.review.completeness) {
  summary.push(`完整度: ${asset.review.completeness}`)
 }

 return summary
}

export function getAssetNextGate(asset: WorkbenchAssetEntry) {
 if (asset.type === 'page' && asset.implementation.strategy === 'native-fallback') {
  return '先从页面里抽出可复用视觉单元，再谈页面复用'
 }

 if (asset.type === 'page' && asset.implementation.fallbackHtmlBlocks.length) {
  return '把剩余原生区块继续抽成组件，降低页面壳层厚度'
 }

 if (asset.composition.missingCapabilities.length) {
  return `优先补齐缺失资产: ${asset.composition.missingCapabilities[0]}`
 }

 if (asset.status === 'draft') {
  return '先补齐来源信息，再进入正式清洗'
 }
 if (asset.status === 'raw-candidate') {
  return '先完成解耦清洗，再进入 cleaned-candidate 和独立预览'
 }
 if (asset.status === 'candidate' || asset.status === 'cleaned-candidate') {
  return asset.preview.integrationRoute ? '可进入集成预览评审' : '先在 workbench 完成独立预览'
 }
 if (asset.status === 'official') {
  return '补同步目标和集成验证记录'
 }
 if (asset.status === 'integration-approved') {
  return '允许进入真实项目 __preview__'
 }
 if (asset.status === 'synced') {
  return '关注真实项目反馈并回流知识库'
 }
 return '待补充门禁规则'
}

export function formatCompositionLink(item: WorkbenchAssetCompositionLink) {
 const assetName = getAssetDisplayNameById(item.assetId)
 return `${assetName} / ${item.role}${item.required ? '' : ' / optional'}`
}

export function getAssetSummary(asset: WorkbenchAssetEntry) {
 if (asset.type === 'page') {
  if (asset.implementation.strategy === 'native-fallback') {
   return '页面还停留在原生草稿层，下一步应该先抽出稳定视觉单元。'
  }

  if (asset.implementation.fallbackHtmlBlocks.length) {
   return `页面已经开始引用沉淀组件，但还剩 ${asset.implementation.fallbackHtmlBlocks.length} 个原生区块待抽离。`
  }

  if (asset.composition.composedOf.length) {
   return `页面已进入组件装配层，当前由 ${asset.composition.composedOf.length} 个资产协同组成。`
  }

  return '页面结构已经清晰，可以继续补边界态和真实项目接入。'
 }

 if (asset.implementation.realComponentRefs) {
  return asset.preview.demoRoute
   ? '已经站在真实 project-mamba 依赖链上，可以直接看效果并继续补边界。'
   : '已经对齐真实组件基线，下一步补独立预览或集成接入。'
 }

 if (asset.implementation.fallbackHtmlBlocks.length) {
  return `当前还是候选视觉单元，仍有 ${asset.implementation.fallbackHtmlBlocks.length} 处原生补位待收敛。`
 }

 return '当前还在候选阶段，适合继续清洗 API、边界和真实依赖引用。'
}
