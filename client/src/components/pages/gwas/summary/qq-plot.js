import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Spinner } from 'react-bootstrap';
import {
  viewportToLocalCoordinates,
  createElement as h
} from '../../../plots/custom/utils';
import { PlotlyWrapper as Plot } from '../../../plots/plotly/plotly-wrapper';

export function QQPlot({ onVariantLookup }) {
  const {
    loadingQQPlot,
    qqplotData,
    qqplotLayout,
  } = useSelector(state => state.qqPlot);

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSex, setSelectedSex] = useState(null);


  const config = {
    responsive: true,
    toImageButtonOptions: {
      format: 'svg', // one of png, svg, jpeg, webp
      filename: 'custom_image',
      height: 1000,
      width: 1000,
      scale: 1 // Multiply title/legend/axis/canvas sizes by this factor
    },
    displaylogo: false,
    modeBarButtonsToRemove: [
      'zoom2d',
      'zoomIn2d',
      'zoomOut2d',
      'select2d',
      'autoScale2d',
      'hoverClosestCartesian',
      'hoverCompareCartesian',
      'lasso2d'
    ]
  };

  const createTooltip = () => {
    const tooltip = document.createElement('div');
    tooltip.classList.add('qq-plot-tooltip');
    tooltip.classList.add('popup-tooltip');
    tooltip.style.display = 'none';
    tooltip.style.position = 'absolute';
    return tooltip;
  };

  const showTooltip = (ev, tooltip, html, containerWidth) => {
    let { x, y } = viewportToLocalCoordinates(
      ev.clientX,
      ev.clientY,
      ev.target
    );

    // console.log("ev target", ev.target);

    // determine where to place tooltip relative to cursor
    const targetWidth = ev.target.width.baseVal.value;
    // const targetHeight = ev.target.height.baseVal.value;
    // console.log("targetWidth", targetWidth);
    // console.log("targetHeight", targetHeight);

    tooltip.innerHTML = '';
    tooltip.style.display = 'inline-block';

    if (html instanceof Element) {
      tooltip.insertAdjacentElement('beforeend', html);
    } else {
      tooltip.insertAdjacentHTML('beforeend', html);
    }
    const tooltipWidth = tooltip.clientWidth;
    // const tooltipHeight = tooltip.clientHeight;
    // console.log("tooltipWidth", tooltipWidth);
    // console.log("tooltipHeight", tooltipHeight);
    let tooltipLeft = x + 80;
    let tooltipTop = y + 100;
    if (containerWidth.includes('px')) {
      containerWidth = containerWidth.replace(/px/, '');
    }
    if (tooltipLeft + tooltipWidth > containerWidth) {
      tooltipLeft = targetWidth - (containerWidth - tooltipLeft);
    }
    // console.log("tooltipLeft", tooltipLeft);
    // console.log("tooltipTop", tooltipTop);
    tooltip.style.left = tooltipLeft + 'px';
    tooltip.style.top = tooltipTop + 'px';
  };

  const hideTooltip = () => {
    // if tooltip already exists, destroy
    const elem = document.getElementsByClassName('qq-plot-tooltip');
    if (elem && elem.length > 0) {
      elem[0].remove();
    }
    // tooltip.style.display = 'none';
  };

  function getHTML(tooltipData) {
    if (tooltipData.display) {
      setSelectedVariant(tooltipData);
      setSelectedSex(tooltipData.sex);
      return h('div', { className: '' }, [
        h('div', null, [
          h('b', null, 'position: '),
          `${tooltipData.chr ? tooltipData.chr : ''}:${
            tooltipData.bp ? tooltipData.bp : ''
          }`
        ]),
        h('div', null, [
          h('b', null, 'p-value: '),
          `${tooltipData.p ? tooltipData.p : ''}`
        ]),
        h('div', null, [
          h('b', null, 'snp: '),
          `${tooltipData.snp ? tooltipData.snp : ''}`
        ]),
        h('div', null, [
          h(
            'a',
            {
              className: 'font-weight-bold',
              href: 'javascript:void(0)',
              onclick: () =>
                document.getElementById('hidden-variant-lookup-link').click()
            },
            'Go to Variant Lookup'
          )
        ]),
        h('div', {
          className: 'tooltip-close',
          style: 'position: absolute; cursor: pointer; top: 0px; right: 5px;'
        }, [
          h(
            'i', {
              className: 'fa fa-times',
              onclick: () => hideTooltip()
            }, ``),
            ``
        ])
      ]);
    } else  {
      return h('div', { className: '' }, [
        h('span', null, 'No information displayed'),
        h('br', null, []),
        h('span', null, 'for variants with -log'),
        h('sub', null, '10'),
        h('span', null, '(p) < 3.'),
        h('div', {
          className: 'tooltip-close',
          style: 'position: absolute; cursor: pointer; top: 0px; right: 5px;'
        }, [
          h(
            'i', {
              className: 'fa fa-times',
              onclick: () => hideTooltip()
            }, ``),
            ``
        ])
      ]);
    }
  }

  function popupMarkerClick(e) {
    e.event.preventDefault();
    // close all plotly hover tooltips
    var plotlyHoverTooltips = document.getElementsByClassName("hovertext");
    if (plotlyHoverTooltips.length > 0) {
      plotlyHoverTooltips[0].setAttribute("style", "display: none;")
    }
    const ev = e.event;
    const points = e.points;
    if (e && ev && points && points[0]) {
      hideTooltip();
      const tooltip = createTooltip();
      // add tooltip to qq-plot container
      const qqPlotContainer = document.getElementsByClassName('qq-plot')[0];
      const containerStyle = getComputedStyle(qqPlotContainer);
      if (containerStyle.position === 'static') {
        qqPlotContainer.style.position = 'relative';
      }
      qqPlotContainer.appendChild(tooltip);
      // show tooltip
      let tooltipData = {};
      // display variant info only if text provided (-nlogp >= 3)
      if (points[0]["data"]["hoverinfo"] === "text") {
        tooltipData = {
          ...points[0].text,
          sex: points[0].data.name,
          display: true
        };
      } else {
        tooltipData = {
          display: false
        };
      }
      let containerWidth = containerStyle.width;
      if (tooltipData) {
        const html = getHTML(tooltipData);
        showTooltip(ev, tooltip, html, containerWidth);
      }
    }
  }

  return (
    <>
      <div className="row mt-3">
        <div className="col-md-12 text-center">
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'left'
            }}>
            <Plot
              className="qq-plot"
              style={{
                display: !loadingQQPlot ? 'block' : 'none',
                position: 'relative',
                height: '800px',
                width: '800px'
              }}
              data={qqplotData}
              layout={qqplotLayout}
              config={config}
              onClick={e => {
                e.event.preventDefault();
                popupMarkerClick(e);
              }}
              onRelayout={relayout => {
                hideTooltip();
              }}
            />
            <a
              id="hidden-variant-lookup-link"
              className="font-weight-bold"
              style={{ display: 'none' }}
              href="#/gwas/lookup"
              onClick={e => {
                onVariantLookup && onVariantLookup(selectedVariant, selectedSex);
              }}>
              Go to Variant Lookup
            </a>
          </div>
          <div
            className="text-center"
            style={{ display: loadingQQPlot ? 'block' : 'none' }}>
            <Spinner animation="border" variant="primary" role="status">
              <span className="sr-only">Loading...</span>
            </Spinner>
          </div>
        </div>
      </div>
    </>
  );
}
