/** RTL → LTR SVG path swaps (etimad / trsyat LTR pattern). */
export function applyLtrArrowFixes(html) {
  return html
    .replaceAll(
      'd="M8.47485 15.5583L3.41652 10.5L8.47485 5.44165"',
      'd="M12.5251 5.44172L17.5835 10.5L12.5251 15.5583"',
    )
    .replaceAll('d="M17.583 10.5H3.55801"', 'd="M3.417 10.5H17.442"')
    .replaceAll(
      'd="M12.025 15.0586L17.0833 10.0002L12.025 4.94189"',
      'd="M7.975 4.94165L2.91666 10.0000L7.975 15.0583"',
    )
    .replaceAll('d="M2.91667 10H16.9417"', 'd="M17.0833 10H3.05829"')
    .replaceAll('d="M10 4L6 8L10 12"', 'd="M6 4L10 8L6 12"');
}
