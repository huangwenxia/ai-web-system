export type WorkbenchAssetType = 'component' | 'page' | 'pattern'
export type WorkbenchAssetImplementationStrategy =
 | 'project-component'
 | 'asset-composed'
 | 'mixed'
 | 'native-fallback'
 | 'pattern-primitive'

export interface WorkbenchAssetPreview {
 catalogRoute: string
 demoRoute: string | null
 integrationHost: string | null
 integrationRoute: string | null
}

export interface WorkbenchAssetRuntimeProfile {
 sourceProject: string | null
 tailwindSources: string[]
 publicRoots: string[]
 baseScss: string | null
 iconfont: string | null
 sharedPackages: string[]
}

export interface WorkbenchAssetSourceTrace {
 sourceProject: string | null
 sourcePath: string | null
 sourceKind: string | null
 extractedFromPage: string | null
 contextType: string | null
 portabilityLevel: string | null
 adapterRequired: string[]
 removedCouplings: string[]
 mockRequired: boolean
}

export interface WorkbenchAssetReview {
 reusability?: string
 apiStability?: string
 visualQuality?: string
 boundaryCompleteness?: string
 structureQuality?: string
 completeness?: string
 quality?: string
 notes: string
}

export interface WorkbenchAssetImplementation {
 strategy: WorkbenchAssetImplementationStrategy
 realComponentRefs: boolean
 fallbackHtmlBlocks: string[]
 notes: string
}

export interface WorkbenchAssetCompositionLink {
 assetId: string
 role: string
 required: boolean
}

export interface WorkbenchAssetComposition {
 composedOf: WorkbenchAssetCompositionLink[]
 missingCapabilities: string[]
 notes: string
}

export interface WorkbenchAssetEntry {
 id: string
 name: string
 type: WorkbenchAssetType
 status: string
 version: string
 sourceCreatedAt: string | null
 sourceCreatedFrom: string | null
 sourceTask: string | null
 tags: string[]
 compatibility: {
  projects: string[]
  dependencies: string[]
  forbidden: string[]
 }
 runtimeProfile: WorkbenchAssetRuntimeProfile
 sync: {
  allowed: boolean
  targetProject: string | null
  targetPath: string | null
  lastSyncedAt: string | null
 }
 review: WorkbenchAssetReview
 implementation: WorkbenchAssetImplementation
 composition: WorkbenchAssetComposition
 preview: WorkbenchAssetPreview
 sourceTrace: WorkbenchAssetSourceTrace
}

export interface SourceInventorySample {
 id: string
 project: string
 sourceType: string
 relativePath: string
 fileName: string
 importCount: number
 localDependencyCount: number
 candidateScore: number
 usesRouter: boolean
 usesStore: boolean
 usesRequest: boolean
 usesI18n: boolean
 usesPermission: boolean
}

export interface SourceInventoryFamilySample {
 id: string
 project: string
 relativePath: string
 sourceType: string
 candidateScore: number
 importCount: number
 localDependencyCount: number
 adapters: string[]
}

export interface SourceInventoryIgnoredFamily {
 familyName: string
 occurrenceCount: number
 samplePaths: string[]
}

export interface SourceInventoryDuplicateComponentFamily {
 familyName: string
 normalizedName: string
 score: number
 projectCount: number
 projects: string[]
 entryCount: number
 sharedViewCount: number
 pageBlockCount: number
 averageCandidateScore: number
 averageImportCount: number
 averageLocalDependencyCount: number
 cleanEntryCount: number
 inCommon: boolean
 adapterCounts: Record<string, number>
 sourceTypes: Record<string, number>
 representativeEntryId: string
 representativePath: string
 sampleEntries: SourceInventoryFamilySample[]
 recommendation: string
 reasons: string[]
}

export interface SourceInventoryBacklogItem extends SourceInventoryDuplicateComponentFamily {
 rank: number
}

export interface SourceInventoryProjectSummary {
 name: string
 totalVueFiles: number
 likelyCandidates: number
 sourceTypes: Record<string, number>
}

export interface SourceInventorySummary {
 generatedAt: string
 sourceRoot: string
 totalProjects: number
 totalVueFiles: number
 likelyCandidates: number
 projects: SourceInventoryProjectSummary[]
 sampleCandidates: SourceInventorySample[]
 duplicateComponentFamilyCount: number
 duplicateComponentFamilies: SourceInventoryDuplicateComponentFamily[]
 priorityBacklog: SourceInventoryBacklogItem[]
 ignoredFamilies: SourceInventoryIgnoredFamily[]
}
