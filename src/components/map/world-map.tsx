'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import type { GeoJSON } from 'geojson';

const LeafletMap = dynamic(
  () => import('./leaflet-map').then((mod) => mod.LeafletMap),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center bg-card rounded-xl h-full min-h-[500px]">
      <div className="animate-pulse text-muted-foreground">Harita yükleniyor...</div>
    </div>
  )}
);

interface WorldMapProps {
  onCountrySelect: (country: { code: string; name: string; lat: number; lng: number }) => void;
  className?: string;
}

export function WorldMap({ onCountrySelect, className }: WorldMapProps) {
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then((res) => res.json())
      .then((data) => setGeoJsonData(data))
      .catch(console.error);
  }, []);

  if (!geoJsonData) {
    return (
      <div className={cn('flex items-center justify-center bg-card rounded-xl', className)}>
        <div className="animate-pulse text-muted-foreground">Harita yükleniyor...</div>
      </div>
    );
  }

  const countryNames: Record<string, string> = {
    AFG: 'Afganistan', ALB: 'Arnavutluk', DZA: 'Cezayir', AND: 'Andorra', AGO: 'Angola',
    ARG: 'Arjantin', ARM: 'Ermenistan', AUS: 'Avustralya', AUT: 'Avusturya', AZE: 'Azerbaycan',
    BHS: 'Bahamalar', BHR: 'Bahreyn', BGD: 'Bangladeş', BLR: 'Belarus', BEL: 'Belçika',
    BLZ: 'Belize', BEN: 'Benin', BTN: 'Butan', BOL: 'Bolivya', BIH: 'Bosna-Hersek',
    BWA: 'Botsvana', BRA: 'Brezilya', BRN: 'Brunei', BGR: 'Bulgaristan', BFA: 'Burkina Faso',
    BDI: 'Burundi', KHM: 'Kamboçya', CMR: 'Kamerun', CAN: 'Kanada', CAF: 'Orta Afrika Cumhuriyeti',
    TCD: 'Çad', CHL: 'Şili', CHN: 'Çin', COL: 'Kolombiya', COM: 'Komorlar',
    COG: 'Kongo Cumhuriyeti', COD: 'Demokratik Kongo Cumhuriyeti', CRI: 'Kosta Rika', CIV: 'Fildişi Sahili',
    HRV: 'Hırvatistan', CUB: 'Küba', CYP: 'Kıbrıs', CZE: 'Çekya', DNK: 'Danimarka',
    DJI: 'Cibuti', DOM: 'Dominik Cumhuriyeti', ECU: 'Ekvador', EGY: 'Mısır', SLV: 'El Salvador',
    GNQ: 'Ekvatoral Ginea', ERI: 'Eritre', EST: 'Estonya', ETH: 'Etiyopya', FIN: 'Finlandiya',
    FRA: 'Fransa', GAB: 'Gabon', GMB: 'Gambiya', GEO: 'Gürcistan', DEU: 'Almanya',
    GHA: 'Gana', GRC: 'Yunanistan', GTM: 'Guatemala', GIN: 'Gine', GNB: 'Gine-Bissau',
    GUY: 'Guyana', HTI: 'Haiti', HND: 'Honduras', HUN: 'Macaristan', ISL: 'İzlanda',
    IND: 'Hindistan', IDN: 'Endonezya', IRN: 'İran', IRQ: 'Irak', IRL: 'İrlanda',
    ISR: 'İsrail', ITA: 'İtalya', JAM: 'Jamaika', JPN: 'Japonya', JOR: 'Ürdün',
    KAZ: 'Kazakistan', KEN: 'Kenya', PRK: 'Kuzey Kore', KOR: 'Güney Kore', KWT: 'Kuveyt',
    KGZ: 'Kırgızistan', LAO: 'Laos', LVA: 'Letonya', LBN: 'Lübnan', LSO: 'Lesoto',
    LBR: 'Liberya', LBY: 'Libya', LIE: 'Liechtenstein', LTU: 'Litvanya', LUX: 'Lüksemburg',
    MKD: 'Kuzey Makedonya', MDG: 'Madagaskar', MWI: 'Malavi', MYS: 'Malezya', MDV: 'Maldivler',
    MLI: 'Mali', MLT: 'Malta', MRT: 'Moritanya', MUS: 'Mauritius', MEX: 'Meksika',
    MDA: 'Moldova', MCO: 'Monako', MNG: 'Moğolistan', MNE: 'Karadağ', MAR: 'Fas',
    MOZ: 'Mozambik', MMR: 'Myanmar', NAM: 'Namibya', NPL: 'Nepal', NLD: 'Hollanda',
    NZL: 'Yeni Zelanda', NIC: 'Nikaragua', NER: 'Nijer', NGA: 'Nijerya', NOR: 'Norveç',
    OMN: 'Oman', PAK: 'Pakistan', PAN: 'Panama', PNG: 'Papua Yeni Gine', PRY: 'Paraguay',
    PER: 'Peru', PHL: 'Filipinler', POL: 'Polonya', PRT: 'Portekiz', QAT: 'Katar',
    ROU: 'Romanya', RUS: 'Rusya', RWA: 'Ruanda', SMR: 'San Marino', SAU: 'Suudi Arabistan',
    SEN: 'Senegal', SRB: 'Sırbistan', SLE: 'Sierra Leone', SGP: 'Singapur', SVK: 'Slovakya',
    SVN: 'Slovenya', SOM: 'Somali', ZAF: 'Güney Afrika', SSD: 'Güney Sudan', ESP: 'İspanya',
    LKA: 'Sri Lanka', SDN: 'Sudan', SUR: 'Surinam', SWZ: 'Esvatini', SWE: 'İsveç',
    CHE: 'İsviçre', SYR: 'Suriye', TWN: 'Tayvan', TJK: 'Tacikistan', TZA: 'Tanzanya',
    THA: 'Tayland', TLS: 'Doğu Timor', TGO: 'Togo', TTO: 'Trinidad ve Tobago', TUN: 'Tunus',
    TUR: 'Türkiye', TKM: 'Türkmenistan', UGA: 'Uganda', UKR: 'Ukrayna', ARE: 'Birleşik Arap Emirlikleri',
    GBR: 'Birleşik Krallık', USA: 'Amerika Birleşik Devletleri', URY: 'Uruguay', UZB: 'Özbekistan',
    VEN: 'Venezuela', VNM: 'Vietnam', YEM: 'Yemen', ZMB: 'Zambiya', ZWE: 'Zimbabwe',
    KOS: 'Kosova', PSE: 'Filistin'
  };

  const onEachFeature = (feature: GeoJSON.Feature, layer: any) => {
    const countryCode = feature.properties?.ISO_A3 || feature.properties?.ADM0_A3;
    const countryName = countryNames[countryCode] || feature.properties?.NAME || 'Bilinmeyen Ülke';
    
    layer.on({
      click: () => {
        const coords = (feature.geometry as GeoJSON.Point)?.coordinates;
        const lat = coords ? coords[1] : 0;
        const lng = coords ? coords[0] : 0;
        onCountrySelect({ code: countryCode, name: countryName, lat, lng });
      },
      mouseover: (e: any) => {
        const l = e.target as any;
        l.setStyle({
          fillColor: '#6366f1',
          fillOpacity: 0.7,
          color: '#6366f1',
          weight: 2,
        });
        l.bindTooltip(countryName, {
          permanent: false,
          direction: 'top',
          className: 'bg-card text-foreground border border-border rounded-lg px-2 py-1 text-sm shadow-xl',
        }).openTooltip();
      },
      mouseout: (e: any) => {
        const l = e.target as any;
        l.setStyle({
          fillColor: '#27273a',
          fillOpacity: 0.5,
          color: '#3f3f5a',
          weight: 1,
        });
        l.closeTooltip();
      },
    });
  };

  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)}>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <LeafletMap
        center={[20, 0]}
        zoom={2}
        className="h-full w-full min-h-[500px]"
        geoJsonData={geoJsonData}
        onEachFeature={onEachFeature}
      />
      <div className="absolute bottom-4 left-4 rounded-lg bg-card/90 backdrop-blur-sm border border-border px-3 py-2 text-xs text-muted-foreground">
        🗺️ Haritaya tıklayarak tahmin oluştur
      </div>
    </div>
  );
}
