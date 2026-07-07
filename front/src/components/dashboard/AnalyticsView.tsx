import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

interface Product {
  id_producto: number;
  nombre: string;
}

interface OrderDetail {
  id_detalle: number;
  id_producto: number;
  cantidad_solicitada: number;
  producto?: {
    nombre: string;
  };
}

interface Order {
  id_pedido: number;
  estado: string;
  fecha_creacion: string;
  detalles: OrderDetail[];
}

interface AnalyticsViewProps {
  baseUrl: string;
}

// Mock monthly consumption dataset (fallback)
const MOCK_MONTHLY_DATA: { [productName: string]: { [year: string]: number[] } } = {
  'Detergente Industrial': {
    '2026': [45, 52, 68, 74, 80, 95, 40, 30, 85, 92, 110, 120],
    '2025': [40, 48, 55, 60, 72, 85, 35, 25, 78, 85, 98, 105],
  },
  'Lejía Concentrada': {
    '2026': [20, 25, 30, 28, 35, 42, 15, 18, 38, 40, 50, 45],
    '2025': [18, 22, 26, 25, 30, 36, 12, 14, 32, 35, 42, 40],
  },
  'Detergente Textil': {
    '2026': [15, 12, 18, 22, 25, 30, 10, 12, 28, 32, 40, 38],
    '2025': [12, 10, 15, 18, 22, 26, 8, 10, 24, 28, 35, 32],
  },
  'Limpia Cristales Concentrado': {
    '2026': [30, 35, 40, 45, 50, 55, 25, 20, 48, 52, 60, 65],
    '2025': [25, 30, 36, 40, 45, 50, 20, 18, 42, 48, 55, 58],
  }
};

const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTH_SHORT_LABELS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const PRODUCT_COLORS = [
  '#5C8E8D', // Teal
  '#0EA5E9', // Sky Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#6366F1'  // Indigo
];

export default function AnalyticsView({ baseUrl }: AnalyticsViewProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isMobile = width < 768;

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Filter States
  const [analysisType, setAnalysisType] = useState<'anual' | 'mensual'>('anual');
  const [selectedMonth, setSelectedMonth] = useState<number>(5); // Default to June (index 5)
  const [selectedYear, setSelectedYear] = useState<string>('2026');

  // Interactive Selected Product for Monthly Trend Bar Chart
  const [trendProduct, setTrendProduct] = useState<string>('Detergente Industrial');

  // Aggregated data
  const [donutData, setDonutData] = useState<{ name: string; quantity: number; percentage: number; color: string }[]>([]);
  const [totalUnits, setTotalUnits] = useState<number>(0);
  const [monthlyTrendValues, setMonthlyTrendValues] = useState<number[]>(new Array(12).fill(0));
  const [isUsingMocks, setIsUsingMocks] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const productsRes = await fetch(`${baseUrl}/productos`);
      const ordersRes = await fetch(`${baseUrl}/pedidos`);

      let fetchedProducts: Product[] = [];
      let fetchedOrders: Order[] = [];

      if (productsRes.ok) {
        fetchedProducts = await productsRes.json();
        setProducts(fetchedProducts);
      }
      if (ordersRes.ok) {
        fetchedOrders = await ordersRes.json();
        setOrders(fetchedOrders);
      }

      const completedOrders = fetchedOrders.filter(o => o.estado === 'ENTREGADO');

      if (completedOrders.length === 0) {
        setIsUsingMocks(true);
        calculateMockAnalytics(fetchedProducts);
      } else {
        setIsUsingMocks(false);
        calculateRealAnalytics(completedOrders, fetchedProducts);
      }

    } catch (e) {
      console.error('Error fetching analytics data:', e);
      setIsUsingMocks(true);
      calculateMockAnalytics([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateRealAnalytics = (completedOrders: Order[], allProducts: Product[]) => {
    // 1. Calculate Donut Chart Data based on current filters (annual vs monthly)
    const productTotals: { [name: string]: number } = {};

    // Initialise keys for all known products to make sure they have a spot
    const productNames = allProducts.length > 0
      ? allProducts.map(p => p.nombre)
      : Object.keys(MOCK_MONTHLY_DATA);

    productNames.forEach(name => {
      productTotals[name] = 0;
    });

    completedOrders.forEach(order => {
      if (!order.fecha_creacion) return;
      const orderYear = order.fecha_creacion.substring(0, 4);
      if (orderYear !== selectedYear) return;

      if (analysisType === 'mensual') {
        const orderMonth = parseInt(order.fecha_creacion.substring(5, 7), 10) - 1;
        if (orderMonth !== selectedMonth) return;
      }

      order.detalles.forEach(detail => {
        const name = detail.producto?.nombre || 'Producto Desconocido';
        const qty = parseFloat(detail.cantidad_solicitada.toString());
        productTotals[name] = (productTotals[name] || 0) + qty;
      });
    });

    // Sum total units
    const totalSum = Object.values(productTotals).reduce((sum, val) => sum + val, 0);
    setTotalUnits(totalSum);

    // Format Donut Slices
    let colorIndex = 0;
    const formattedDonut = Object.entries(productTotals)
      .map(([name, quantity]) => {
        const percentage = totalSum > 0 ? (quantity / totalSum) : 0;
        const color = PRODUCT_COLORS[colorIndex % PRODUCT_COLORS.length];
        colorIndex++;
        return {
          name,
          quantity,
          percentage: Math.round(percentage * 100),
          color
        };
      })
      .sort((a, b) => b.quantity - a.quantity);

    setDonutData(formattedDonut);

    // 2. Calculate Monthly Trend for the selected trend product
    const monthlyTrend = new Array(12).fill(0);
    completedOrders.forEach(order => {
      if (!order.fecha_creacion) return;
      const orderYear = order.fecha_creacion.substring(0, 4);
      if (orderYear !== selectedYear) return;

      const monthIndex = parseInt(order.fecha_creacion.substring(5, 7), 10) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        order.detalles.forEach(detail => {
          const name = detail.producto?.nombre || '';
          if (name.toLowerCase() === trendProduct.toLowerCase()) {
            monthlyTrend[monthIndex] += parseFloat(detail.cantidad_solicitada.toString());
          }
        });
      }
    });
    setMonthlyTrendValues(monthlyTrend);
  };

  const calculateMockAnalytics = (allProducts: Product[]) => {
    // 1. Calculate Donut Chart Data based on current filters using Mock Data
    const productNames = Object.keys(MOCK_MONTHLY_DATA);
    const productTotals: { [name: string]: number } = {};

    productNames.forEach(name => {
      const yearData = MOCK_MONTHLY_DATA[name][selectedYear] || MOCK_MONTHLY_DATA[name]['2026'];
      if (analysisType === 'anual') {
        productTotals[name] = yearData.reduce((s, v) => s + v, 0);
      } else {
        productTotals[name] = yearData[selectedMonth] || 0;
      }
    });

    const totalSum = Object.values(productTotals).reduce((sum, val) => sum + val, 0);
    setTotalUnits(totalSum);

    let colorIndex = 0;
    const formattedDonut = Object.entries(productTotals)
      .map(([name, quantity]) => {
        const percentage = totalSum > 0 ? (quantity / totalSum) : 0;
        const color = PRODUCT_COLORS[colorIndex % PRODUCT_COLORS.length];
        colorIndex++;
        return {
          name,
          quantity,
          percentage: Math.round(percentage * 100),
          color
        };
      })
      .sort((a, b) => b.quantity - a.quantity);

    setDonutData(formattedDonut);

    // 2. Calculate Monthly Trend for Mock selected product
    const pName = MOCK_MONTHLY_DATA[trendProduct] ? trendProduct : 'Detergente Industrial';
    const yKey = MOCK_MONTHLY_DATA[pName][selectedYear] ? selectedYear : '2026';
    const monthlyTrend = MOCK_MONTHLY_DATA[pName][yKey] || new Array(12).fill(0);
    setMonthlyTrendValues(monthlyTrend);
  };

  useEffect(() => {
    fetchData();
  }, [analysisType, selectedMonth, selectedYear, trendProduct]);

  // Circumference for Donut SVG (Radius = 40)
  // C = 2 * PI * R = 2 * 3.14159 * 40 = 251.327
  const circumference = 251.33;
  let accumulatedPercentage = 0;

  const donutSlices = donutData.map((slice) => {
    const strokeLength = (slice.percentage / 100) * circumference;
    const strokeOffset = -((accumulatedPercentage / 100) * circumference);
    accumulatedPercentage += slice.percentage;
    return {
      ...slice,
      strokeLength,
      strokeOffset,
    };
  });

  // Scale calculations for Monthly Trend Bar Chart
  const maxTrendVal = Math.max(...monthlyTrendValues, 10);
  const scaleMax = Math.ceil(maxTrendVal / 10) * 10;
  const gridTicks = [0, scaleMax * 0.25, scaleMax * 0.5, scaleMax * 0.75, scaleMax];

  return (
    <View style={styles.container}>
      {/* View Header */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.viewTitle}>ANALÍTICA DE CONSUMO</Text>
          <Text style={styles.viewSub}>Visualiza la distribución de productos consumidos en la empresa</Text>
        </View>
        {isUsingMocks && (
          <View style={styles.mockBadge}>
            <Feather name="info" size={12} color="#D97706" />
            <Text style={styles.mockBadgeText}>Vista Demo (Datos emulados sin pedidos entregados)</Text>
          </View>
        )}
      </View>

      {/* Filter Section */}
      <View style={styles.filterCard}>
        <Text style={styles.filterTitle}>Configurar Período de Análisis</Text>
        <View style={[styles.filterRow, isMobile && { flexDirection: 'column', gap: 12 }]}>

          <View style={[styles.filterGroup, { flex: 1 }]}>
            <Text style={styles.filterLabel}>Año</Text>
            <View style={styles.selectWrapper}>
              <select
                style={styles.htmlSelect}
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </View>
          </View>

          <View style={[styles.filterGroup, { flex: 1.5 }]}>
            <Text style={styles.filterLabel}>Tipo de Análisis</Text>
            <View style={styles.selectWrapper}>
              <select
                style={styles.htmlSelect}
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value as 'anual' | 'mensual')}
              >
                <option value="anual">Consumo Anual Completo</option>
                <option value="mensual">Consumo Mensual Específico</option>
              </select>
            </View>
          </View>

          {analysisType === 'mensual' && (
            <View style={[styles.filterGroup, { flex: 1.5 }]}>
              <Text style={styles.filterLabel}>Seleccionar Mes</Text>
              <View style={styles.selectWrapper}>
                <select
                  style={styles.htmlSelect}
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                >
                  {MONTH_LABELS.map((monthName, idx) => (
                    <option key={idx} value={idx}>{monthName}</option>
                  ))}
                </select>
              </View>
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5C8E8D" />
        </View>
      ) : (
        <View style={styles.mainLayout}>

          {/* Row 1: Donut Chart Distribution */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderWithIcon}>
                <View style={styles.iconBadgePink}>
                  <Feather name="tag" size={16} color="#EC4899" />
                </View>
                <View>
                  <Text style={styles.cardTitle}>Ventas por categoría</Text>
                  <Text style={styles.cardSub}>
                    {analysisType === 'anual' ? `Año ${selectedYear}` : `${MONTH_LABELS[selectedMonth]} de ${selectedYear}`}
                  </Text>
                </View>
              </View>
            </View>

            {donutData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Feather name="pie-chart" size={48} color="#94A3B8" />
                <Text style={styles.emptyText}>No hay datos de consumo registrados para el período seleccionado.</Text>
              </View>
            ) : (
              <View style={[styles.donutLayout, isMobile && { flexDirection: 'column', alignItems: 'center', gap: 24 }]}>

                {/* SVG Donut Chart using react-native-svg components */}
                <View style={styles.chartWrapper}>
                  <Svg width={220} height={220} viewBox="0 0 120 120" style={{ width: 220, height: 220 }}>
                    {/* Base shadow circle */}
                    <Circle cx="60" cy="60" r="40" fill="transparent" stroke="#F1F5F9" strokeWidth="16" />

                    {/* Slices mapping */}
                    {donutSlices.map((slice, index) => (
                      <Circle
                        key={index}
                        cx="60"
                        cy="60"
                        r="40"
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth="16"
                        strokeDasharray={`${slice.strokeLength} ${circumference}`}
                        strokeDashoffset={slice.strokeOffset}
                        transform="rotate(-90 60 60)"
                      />
                    ))}

                    {/* Center Card */}
                    <Circle cx="60" cy="60" r="32" fill="#FFFFFF" />

                    {/* Middle total text */}
                    <SvgText
                      x="60"
                      y="54"
                      textAnchor="middle"
                      fontSize="6.5"
                      fontWeight="700"
                      fill="#94A3B8"
                      fontFamily="Inter, sans-serif"
                    >
                      Total ventas
                    </SvgText>
                    <SvgText
                      x="60"
                      y="70"
                      textAnchor="middle"
                      fontSize="14"
                      fontWeight="800"
                      fill="#1E293B"
                      fontFamily="Inter, sans-serif"
                    >
                      {totalUnits}
                    </SvgText>
                  </Svg>
                </View>

                {/* Legend list with ranking details */}
                <View style={styles.legendContainer}>
                  {donutData.map((item, idx) => (
                    <View key={idx} style={styles.legendItem}>
                      <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                      <Text style={styles.legendName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.legendValue}>
                        {item.quantity} uds
                      </Text>
                      <Text style={styles.legendPercent}>
                        {item.percentage}%
                      </Text>
                    </View>
                  ))}
                </View>

              </View>
            )}

            {donutData.length > 0 && (
              <View style={styles.highlightAlert}>
                <Feather name="trending-up" size={14} color="#059669" />
                <Text style={styles.highlightAlertText}>
                  <Text style={{ fontWeight: '700', color: '#065F46' }}>
                    {donutData[0]?.name}
                  </Text> es tu producto principal en consumo.
                </Text>
              </View>
            )}
          </View>

          {/* Row 2: Monthly Trend (Selected Product) */}
          <View style={[styles.card, { marginTop: 24 }]}>
            <View style={[styles.cardHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }]}>
              <View>
                <Text style={styles.cardTitle}>Evolución del Consumo Mensual</Text>
                <Text style={styles.cardSub}>Historial de unidades entregadas a lo largo de {selectedYear}</Text>
              </View>

              {/* Product selector specifically for the trend chart */}
              <View style={[styles.selectWrapper, { width: 220, height: 36 }]}>
                <select
                  style={styles.htmlSelect}
                  value={trendProduct}
                  onChange={(e) => setTrendProduct(e.target.value)}
                >
                  {products.length > 0 ? (
                    products.map(p => (
                      <option key={p.id_producto} value={p.nombre}>{p.nombre}</option>
                    ))
                  ) : (
                    Object.keys(MOCK_MONTHLY_DATA).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))
                  )}
                </select>
              </View>
            </View>

            {/* Bar Chart Area */}
            <View style={styles.chartAreaContainer}>
              <View style={styles.yAxisScale}>
                {gridTicks.slice().reverse().map((tick, i) => (
                  <Text key={i} style={styles.scaleText}>{Math.round(tick)} uds</Text>
                ))}
              </View>

              <View style={styles.barsContainer}>
                <View style={styles.gridLinesContainer}>
                  {gridTicks.map((_, i) => (
                    <View key={i} style={styles.gridLine} />
                  ))}
                </View>

                <View style={styles.barsRow}>
                  {monthlyTrendValues.map((val, idx) => {
                    const barHeightPct = scaleMax > 0 ? (val / scaleMax) * 100 : 0;
                    return (
                      <View key={idx} style={styles.barColumn}>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              { height: `${barHeightPct}%` }
                            ]}
                          />
                        </View>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: '#475569', marginTop: 4 }}>{val}</Text>
                        <Text style={styles.barLabel}>{MONTH_SHORT_LABELS[idx]}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>

        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 12,
  },
  viewTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  viewSub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  mockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  mockBadgeText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '500',
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 16,
  },
  filterGroup: {
    flexDirection: 'column',
  },
  filterLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  selectWrapper: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  htmlSelect: {
    width: '100%',
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1E293B',
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    cursor: 'pointer',
  } as any,
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainLayout: {
    flexDirection: 'column',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  emptyContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 320,
  },
  donutLayout: {
    flexDirection: 'row',
    gap: 40,
    alignItems: 'center',
  },
  chartWrapper: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendContainer: {
    flex: 1,
    flexDirection: 'column',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginRight: 10,
  },
  legendPercent: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '700',
    width: 32,
    textAlign: 'right',
  },
  cardHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBadgePink: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDF2F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartAreaContainer: {
    flexDirection: 'row',
    height: 250,
    paddingTop: 10,
  },
  yAxisScale: {
    justifyContent: 'space-between',
    height: 210,
    width: 65,
    paddingRight: 8,
    alignItems: 'flex-end',
  },
  scaleText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  barsContainer: {
    flex: 1,
    position: 'relative',
    height: 210,
  },
  gridLinesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#F1F5F9',
    width: '100%',
  },
  barsRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: 14,
    height: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#5C8E8D',
    borderRadius: 7,
  },
  barLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '500',
  },
  highlightAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  highlightAlertText: {
    fontSize: 13,
    color: '#15803D',
    fontWeight: '500',
    flex: 1,
  },
});
