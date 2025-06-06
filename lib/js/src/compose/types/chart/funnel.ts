import { BaseChart, PartialChart } from './base'
import {
  Dimension,
  Metric,
  Report,
  ChartType,
  formatChartValue,
  formatChartTooltip,
  TooltipParams,
} from './util'
import { getColorschemeColors } from '../../../shared'

export default class FunnelChart extends BaseChart {
  constructor (def: PartialChart = {}) {
    super(def)

    // Assure required fields; this helps with backwards compatibility
    for (const v of (this.config.reports || []) as Array<Report>) {
      for (const d of (v.dimensions || []) as Array<Dimension>) {
        if (!d.meta) {
          d.meta = {}
        }

        if (!d.meta.fields) {
          d.meta.fields = []
        }
      }

      for (const m of (v.metrics || []) as Array<Metric>) {
        if (m.cumulative === undefined) {
          m.cumulative = true
        }
      }
    }
  }

  /**
   * Since funnel charts always define one type, this check can be simplified
   */
  mtrCheck ({ field, aggregate }: Metric) {
    if (!field) {
      throw new Error('notification.chart.invalidConfig.missingMetricsField')
    }
    if (field !== 'count' && !aggregate) {
      throw new Error('notification.chart.invalidConfig.missingMetricsAggregate')
    }
  }

  /**
   * Extend this method to include filtering for just specific values.
   * For example:
   * We wish to show only new and converted leads.
   */
  formatReporterParams (r: Report) {
    const base = super.formatReporterParams(r)
    const ff = base.filter

    let df = ''
    if (r.dimensions && r.dimensions[0]) {
      const rd = r.dimensions[0]
      if (r.dimensions[0].meta) {
        const fields = r.dimensions[0].meta.fields || []
        df = fields.map(({ value }: any) => `${rd.field || ''}='${value}'`)
          .join(' OR ')
      }
    }

    if (ff && df) {
      base.filter = `(${base.filter}) AND (${df})`
    } else if (!ff && df) {
      base.filter = df
    }

    return base
  }

  // Funnel chart creates a metric including all reports, so this step is deferred to there
  makeDataset (m: Metric, d: Dimension, data: Array<number|any>, alias: string) {
    return {
      type: m.type,
      label: m.label || m.field,
      data,
      tooltip: {
        fixed: !!m.fixTooltips,
        relative: !!m.relativeValue,
      },
      formatting: m.formatting,
    }
  }

  makeOptions (data: any) {
    const { reports = [], colorScheme, noAnimation = false, toolbox } = this.config
    const { saveAsImage } = toolbox || {}

    const { labels, datasets = [], tooltip, themeVariables = {} } = data
    const { fixed, relative } = tooltip

    const { legend: l } = reports[0] || {}
    const { formatting } = datasets[0] || {}

    const colors = getColorschemeColors(colorScheme, data.customColorSchemes)

    return {
      animation: !noAnimation,
      textStyle: {
        fontFamily: themeVariables['font-regular'],
        overflow: 'break',
        color: themeVariables.black,
      },
      toolbox: {
        feature: {
          saveAsImage: saveAsImage ? {
            name: this.name,
          } : undefined,
        },
        top: 15,
        right: 5,
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: TooltipParams): string => {
          const { value = '', percent = '' } = params

          const v = formatChartValue(value, formatting)

          return `${params.seriesName}<br>${params.marker}${params.name}<span style="float: right; margin-left: 20px">${v}${relative ? ' (' + percent + '%)' : ''}</span>`
        },
        appendToBody: true,
      },
      legend: {
        show: !l?.isHidden,
        type: l?.isScrollable ? 'scroll' : 'plain',
        top: (l?.position?.isDefault ? undefined : l?.position?.top) || undefined,
        right: (l?.position?.isDefault ? undefined : l?.position?.right) || undefined,
        bottom: (l?.position?.isDefault ? undefined : l?.position?.bottom) || undefined,
        left: (l?.position?.isDefault ? l?.align || 'center' : l?.position?.left) || 'auto',
        orient: l?.orientation || 'horizontal',
        textStyle: {
          color: themeVariables.black,
        },
        pageTextStyle: {
          color: themeVariables.black,
        },
        pageIconColor: themeVariables.black,
        pageIconInactiveColor: themeVariables.light,
      },
      series: datasets.map(({ data, label, formatting }: any) => {
        return {
          name: label,
          type: 'funnel',
          sort: 'descending',
          top: 45,
          bottom: 10,
          left: '5%',
          width: '90%',
          label: {
            show: fixed,
            position: 'inside',
            align: 'center',
            verticalAlign: 'middle',
            formatter: (params: TooltipParams): string => {
              const { value = '', percent = '' } = params
              const formattedValue = formatChartValue(value, formatting)

              return `${formattedValue}${relative ? ' (' + percent + '%)' : ''}`
            },
          },
          emphasis: {
            label: {
              show: fixed,
              fontSize: 14,
            },
          },
          data: labels.map((name: string, i: number) => {
            return { name, value: data[i], itemStyle: { color: colors[i] } }
          }),
        }
      }),
    }
  }

  baseChartType (): string {
    return 'funnel'
  }

  /**
   * Includes a few additional post processing steps:
   * * generate a set of labels based on all reports, all data sets,
   * * generates a set of data based on all reports, all data sets,
   */
  async fetchReports (a: any) {
    const rr = await super.fetchReports(a) as any
    const values = []

    let tooltip = {}
    let label = ''
    let formatting = {}

    // Above provided data sets might not have their labels/values ordered
    // correctly
    const valMap: any = {}
    // Map values to their labels
    for (let ri = 0; ri < rr.length; ri++) {
      const r = rr[ri]

      r.labels.forEach((l: string, i: number) => {
        valMap[l] = r.datasets[0].data[i]
      })

      tooltip = { ...tooltip, ...r.datasets[0].tooltip }
      label = r.datasets[0].label
      formatting = r.datasets[0].formatting

      // Construct labels & data based on provided reports
      const report = this.config.reports?.[ri]
      const d = report?.dimensions?.[0] as Dimension

      let { fields = [] } = d.meta || {}
      fields = fields.length ? fields : r.labels

      for (const label of fields) {
        const value = typeof label === 'object' ? label.value : label
        values.push({
          // Use value for label and resolve it on FE (i18n)
          label: value,
          data: valMap[value] || 0,
        })
      }
    }

    // We are rendering the chart upside down
    // (by default it renders in ASC, but we want DESC)
    const labels: any[] = []
    const data: any[] = []

    values.sort((a, b) => a.data - b.data).forEach(v => {
      labels.push(v.label)
      data.push(v.data)
    })

    // Determine color to render for specific value
    const colorMap: { [_: string]: string } = {}
    this.config.reports?.forEach(r => {
      const dimension = r.dimensions?.[0]
      if (dimension?.meta?.fields) {
        for (const { value, color } of dimension.meta.fields) {
          colorMap[value] = color
        }
      }
    })

    // Get cumulative data but also keep original for tooltips
    if (this.isCumulative()) {
      for (let i = 1; i < data.length; i++) {
        data[i] += data[i - 1]
      }
    }

    return {
      labels,
      datasets: [{
        label,
        data,
        formatting,
      }],
      tooltip,
    }
  }

  isCumulative (): boolean {
    // Cumulative true by default
    // Find false value
    let cumulative = true
    const { reports = [] } = this.config

    reports.forEach(({ metrics = [] }) => {
      if (cumulative && !metrics[0].cumulative) {
        cumulative = false
      }
    })

    return cumulative
  }

  defMetric (): Metric {
    return Object.assign(super.defMetric(), {
      type: ChartType.funnel,
      fixTooltips: false,
      relativeValue: true,
    })
  }

  defDimension (): Dimension {
    return Object.assign({}, {
      conditions: {},
      meta: { fields: [] },
    })
  }
}
