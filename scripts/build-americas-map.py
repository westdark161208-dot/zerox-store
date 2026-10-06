"""Generate geographic SVG from Natural Earth ne_50m_admin_0_countries.geojson.
Source: https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson
Usage: python scripts/build-americas-map.py /path/to/source.geojson
Natural Earth data is public domain. Never infer user locations from this geometry.
"""
import json, math, sys, html
from pathlib import Path
root=Path(__file__).resolve().parent.parent
regions=json.loads((root/'country-regions.js').read_text().split('Object.freeze(')[1].split(');')[0])
features=json.loads(Path(sys.argv[1]).read_text())['features']
def simplify(points, eps=.055):
    if len(points)<3:return points
    a,b=points[0],points[-1];dx,dy=b[0]-a[0],b[1]-a[1];den=dx*dx+dy*dy
    def distance(p):
        t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den)) if den else 0
        return math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)
    idx=max(range(1,len(points)-1),key=lambda i:distance(points[i]))
    if distance(points[idx])<=eps:return [a,b]
    return simplify(points[:idx+1],eps)[:-1]+simplify(points[idx:],eps)
def point(lon,lat):return ((lon+190)*4,(85-lat)*4)
parts=['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 580" role="img" aria-labelledby="title desc"><title id="title">Usuarios registrados en América</title><desc id="desc">Geografía de Natural Earth. Los puntos se muestran solo para países con registros.</desc><defs><radialGradient id="ocean"><stop stop-color="#103044"/><stop offset="1" stop-color="#050e1b"/></radialGradient></defs><style>.country{fill:#15344a;stroke:#41758b;stroke-width:.5;stroke-linejoin:round}.country:hover{fill:#24536a}.marker circle{stroke:#fff;stroke-width:1.2}.marker:hover circle,.marker:focus circle{stroke-width:3}</style><rect width="680" height="580" fill="url(#ocean)"/>']
centers={}
for f in features:
    prop=f['properties'];code=prop['ISO_A2_EH']
    if code not in regions:continue
    geom=f['geometry'];polys=geom['coordinates'] if geom['type']=='MultiPolygon' else [geom['coordinates']]
    paths=[]
    for poly in polys:
        for ring in poly:
            # Only Aleutian longitudes cross the antimeridian; do not wrap Greenwich.
            points=[(x-360 if x>170 else x,y) for x,y in ring]
            if not all(-190<=x<=-10 and -60<=y<=85 for x,y in points):continue
            if max(x for x,y in points)-min(x for x,y in points)>180:continue
            pts=simplify(points)
            if len(pts)<4:pts=points
            paths.append('M'+'L'.join(f'{x:.1f},{y:.1f}' for x,y in map(lambda p:point(*p),pts))+'Z')
    if paths:parts.append('<path class="country" data-country="'+code+'" d="'+''.join(paths)+'"><title>'+html.escape(prop.get('NAME_ES') or prop['NAME'])+'</title></path>')
    lon,lat=prop['LABEL_X'],prop['LABEL_Y']
    if -190<=lon<=-10 and -60<=lat<=85:centers[code]=[round(v,1) for v in point(lon,lat)]
parts.append('<g id="registered-countries"></g></svg>')
(root/'assets/americas-map.svg').write_text(''.join(parts))
(root/'country-map-points.js').write_text('globalThis.ZXCountryMapPoints = Object.freeze('+json.dumps(centers,separators=(',',':'))+');\n')
print('Countries:',len(centers),'SVG bytes:',(root/'assets/americas-map.svg').stat().st_size)
