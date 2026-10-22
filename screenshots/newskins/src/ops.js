const G=(b)=>`<svg class="op" viewBox="0 0 200 150"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="miter" stroke-linecap="square">${b}</g><text x="100" y="148" text-anchor="middle" font-family="IBM Plex Mono" font-size="7.5" letter-spacing="3" fill="currentColor" opacity=".6">OPERATOR · RG-01</text></svg>`;
const ECG='<path d="M6 124 H30 L34 118 L38 124 L42 102 L47 140 L51 120 L54 124 H146 L149 120 L152 124 L156 106 L160 136 L163 124 H194"/>';
export const OPS={
A:G(`<path d="M84 38 L89 22 H111 L116 38"/><path d="M52 47 L80 38 H120 L148 47"/>
<path d="M82 55 C91 55 96 55 98.5 61.5" stroke-width="3.4"/><path d="M118 55 C109 55 104 55 101.5 61.5" stroke-width="3.4"/>
<path d="M75 48 L76 76 L88 86 H112 L124 76 L125 48"/><path d="M94 74 H103"/>
<path d="M103 74 L129 81" stroke-width="4.5"/><path d="M132 77 L134 72 L137 75 L139 68" stroke-width="1.2" opacity=".7"/>
<path d="M84 84 L78 96 L40 106 L30 124"/><path d="M116 84 L122 96 L160 106 L170 124"/><path d="M6 124 H118 L121 119 L124 124 L128 100 L133 142 L137 119 L140 124 H194"/>`),
A2:G(`<path d="M84 38 L89 22 H111 L116 38"/><path d="M52 47 L80 38 H120 L148 47"/>
<path d="M82 55 C91 55 96 55 98.5 61.5" stroke-width="3.4"/><path d="M118 55 C109 55 104 55 101.5 61.5" stroke-width="3.4"/><path d="M87 61 H92 M108 61 H113" stroke-width="2"/>
<path d="M75 48 L76 76 L88 86 H112 L124 76 L125 48"/><path d="M94 74 H103"/>
<path d="M103 74 L129 81" stroke-width="4.5"/><path d="M132 77 L134 72 L137 75 L139 68" stroke-width="1.2" opacity=".7"/>
<path d="M84 84 L78 96 L40 106 L30 124"/><path d="M116 84 L122 96 L160 106 L170 124"/><path d="M6 124 H118 L121 119 L124 124 L128 100 L133 142 L137 119 L140 124 H194"/>`),
A3:G(`<path d="M73 40 L76 21 H124 L127 40"/><path d="M78 30 H122" stroke-width="1.2" opacity=".5"/><path d="M44 52 L72 40 H128 L156 52 L130 61 H70 Z"/>

<path d="M75 61 L76 76 L88 86 H112 L124 76 L125 61"/><path d="M94 74 H103"/>
<path d="M103 74 L129 81" stroke-width="4.5"/><path d="M132 77 L134 72 L137 75 L139 68" stroke-width="1.2" opacity=".7"/>
<path d="M84 84 L78 96 L40 106 L30 124"/><path d="M116 84 L122 96 L160 106 L170 124"/><path d="M6 124 H118 L121 119 L124 124 L128 100 L133 142 L137 119 L140 124 H194"/>`),
B:G(`<path d="M86 37 L90 23 H110 L114 37"/><path d="M48 44 H152 L136 49 H64 Z"/>
<path d="M74 54 H126" stroke-width="6"/>
<path d="M76 50 L72 74 L86 88 H114 L128 74 L124 50"/>
<path d="M104 76 L118 80" stroke-width="4.5"/><path d="M121 76 L123 71 L126 74 L128 67" stroke-width="1.2" opacity=".7"/>
<path d="M86 88 L66 98 L36 106 L28 124"/><path d="M114 88 L134 98 L164 106 L172 124"/>${ECG}`),
C:G(`<path d="M84 36 L90 22 H110 L116 36"/><path d="M50 40 L82 36 L100 42 L118 36 L150 40 L124 50 L100 53 L76 50 Z"/>
<path d="M78 51 L100 54 L122 51 L121 60 H79 Z" fill="currentColor" stroke="none"/>
<path d="M78 52 L76 74 L84 84 L100 88 L116 84 L124 74 L122 52"/>
<path d="M102 74 L116 77" stroke-width="4.5"/><path d="M119 73 L121 68 L124 71 L126 64" stroke-width="1.2" opacity=".7"/>
<path d="M82 82 L80 94 L38 106 L30 124 M118 82 L120 94 L162 106 L170 124"/>${ECG}`)};
