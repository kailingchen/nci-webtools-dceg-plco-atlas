import {
  UPDATE_KEY,
  UPDATE_SUMMARY_RESULTS,
  UPDATE_MANHATTAN_PLOT,
  UPDATE_QQ_PLOT,
  UPDATE_PCA_PLOT,
  UPDATE_SUMMARY_TABLE,
  UPDATE_SUMMARY_TABLE_INDEX,
  UPDATE_SUMMARY_SNP,
  UPDATE_SUMMARY_SNP_TABLE,
  UPDATE_SUMMARY_SNP_TABLE_INDEX,
  UPDATE_VARIANT_LOOKUP,
  UPDATE_VARIANT_LOOKUP_TABLE,
  UPDATE_PHENOTYPE_CORRELATIONS,
  UPDATE_PHENOTYPES,
  UPDATE_BROWSE_PHENOTYPES,
  UPDATE_BROWSE_PHENOTYPES_PLOTS,
  UPDATE_HEATMAP,
  UPDATE_DOWNLOADS,
  UPDATE_ERROR
} from './actions';

export const rootReducer = (state, action) => {
  switch (action.type) {
    case UPDATE_KEY:
      return {
        ...state,
        [action.key]: action.data
      };
    case UPDATE_SUMMARY_RESULTS:
      return {
        ...state,
        summaryResults: {
          ...state.summaryResults,
          ...action.data
        }
      };
    case UPDATE_MANHATTAN_PLOT:
      return {
        ...state,
        manhattanPlot: {
          ...state.manhattanPlot,
          ...action.data
        }
      };
    case UPDATE_QQ_PLOT:
      return {
        ...state,
        qqPlot: {
          ...state.qqPlot,
          ...action.data
        }
      };
    case UPDATE_PCA_PLOT:
      return {
        ...state,
        pcaPlot: {
          ...state.pcaPlot,
          ...action.data
        }
      };
    case UPDATE_SUMMARY_TABLE:
      let obj = { [action.key]: action.data };
      let summaryTables = {
        ...state.summaryTables,
        ...obj
      };
      return {
        ...state,
        summaryTables
      };
    case UPDATE_SUMMARY_TABLE_INDEX:
      let tables = [...state.summaryTables.tables];
      tables[action.key] = action.data;
      return {
        ...state,
        summaryTables: {
          ...state.summaryTables,
          tables
        }
      };
    case UPDATE_SUMMARY_SNP:
    case UPDATE_SUMMARY_SNP_TABLE:
      let summarySnpTables = {
        ...state.summarySnpTables,
        [action.key]: action.data
      };
      return {
        ...state,
        summarySnpTables
      };
    case UPDATE_SUMMARY_SNP_TABLE_INDEX:
      let snpTables = [...state.summarySnpTables.tables];
      snpTables[action.key] = action.data;
      return {
        ...state,
        summarySnpTables: {
          ...state.summarySnpTables,
          tables: snpTables
        }
      };
    case UPDATE_VARIANT_LOOKUP:
      return {
        ...state,
        variantLookup: {
          ...state.variantLookup,
          ...action.data
        }
      };
    case UPDATE_VARIANT_LOOKUP_TABLE:
      return {
        ...state,
        variantLookupTable: {
          ...state.variantLookupTable,
          ...action.data
        }
      };
    case UPDATE_PHENOTYPE_CORRELATIONS:
      return {
        ...state,
        phenotypeCorrelations: {
          ...state.phenotypeCorrelations,
          ...action.data
        }
      };
    case UPDATE_HEATMAP:
      return {
        ...state,
        heatmap: {
          ...state.heatmap,
          ...action.data
        }
      };
    case UPDATE_PHENOTYPES:
      return {
        ...state,
        phenotypes: action.data
      };
    case UPDATE_BROWSE_PHENOTYPES:
      return {
        ...state,
        browsePhenotypes: {
          ...state.browsePhenotypes,
          ...action.data
        }
      };
    case UPDATE_BROWSE_PHENOTYPES_PLOTS:
      return {
        ...state,
        browsePhenotypesPlots: {
          ...state.browsePhenotypesPlots,
          ...action.data
        }
      };
    case UPDATE_DOWNLOADS:
      return {
        ...state,
        downloads: {
          ...state.downloads,
          ...action.data
        }
      };
    case UPDATE_ERROR:
      return {
        ...state,
        error: {
          ...state.error,
          ...action.data
        }
      };
    default:
      return state;
  }
};
