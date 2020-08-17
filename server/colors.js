const colors = [ "#083045", "#0B374D", "#0D3C55", "#3A6378", "#107895", "#1286A8", "#1395BA", "#43ABC8", "#829254", "#92A660", "#B5C588", "#BBA036", "#D2B53B", "#EBC844", "#EED369", "#C2561A", "#DA611E", "#F16C20", "#F58A4B", "#9A2515", "#AC2A1A", "#C02E1D", "#CD5849" ];

function getColor(seed = Math.random() * 100 | 0) {
  return colors[seed % colors.length];
}

module.exports = { getColor };
