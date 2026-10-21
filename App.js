
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nkczfvapwgmpmumfwses.supabase.co',
  'sb_publishable_YgTYxkXdPDTqnPnbPjMwJQ_5JULfgZL'
);

const categories = ['Tümü', 'Elektronik', 'Giyim', 'Ev', 'Spor', 'Diğer'];

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tümü');
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, price, category, image_url, stock')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Bağlantı hatası', 'Ürünler yüklenemedi. İnternet bağlantını kontrol et.');
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }

  function addToCart(product) {
    if (Number(product.stock) <= 0) {
      Alert.alert('Stokta yok', 'Bu ürün şu anda stokta bulunmuyor.');
      return;
    }

    setCart(previous => {
      const existing = previous.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= Number(product.stock)) {
          Alert.alert('Stok sınırı', 'Stoktaki ürün sayısına ulaştın.');
          return previous;
        }
        return previous.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...previous, { ...product, quantity: 1 }];
    });
    Alert.alert('Sepete eklendi', product.name);
  }

  function changeQuantity(id, amount) {
    setCart(previous =>
      previous
        .map(item =>
          item.id === id
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      (product.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      category === 'Tümü' ||
      (product.category || '').toLowerCase() === category.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.logo}>BULZOVİK</Text>
        <Text style={styles.tagline}>İstediğin burada!</Text>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => setShowCart(!showCart)}
        >
          <Text style={styles.cartButtonText}>
            {showCart ? '← Mağazaya dön' : `🛒 Sepet (${totalItems})`}
          </Text>
        </TouchableOpacity>
      </View>

      {showCart ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.heading}>Alışveriş Sepetin</Text>
          {cart.length === 0 ? (
            <Text style={styles.empty}>Sepetin henüz boş.</Text>
          ) : (
            <>
              {cart.map(item => (
                <View key={item.id} style={styles.cartRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.price}>
                      {(Number(item.price) * item.quantity).toLocaleString('tr-TR')} TL
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => changeQuantity(item.id, -1)}>
                    <Text style={styles.quantityButton}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => changeQuantity(item.id, 1)}>
                    <Text style={styles.quantityButton}>+</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <Text style={styles.total}>
                Toplam: {totalPrice.toLocaleString('tr-TR')} TL
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() =>
                  Alert.alert(
                    'Sipariş aşaması',
                    'Sepetin hazır! Sipariş formunu ve güvenli sipariş kaydını bir sonraki adımda kuracağız.'
                  )
                }
              >
                <Text style={styles.primaryButtonText}>Siparişe geç</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      ) : (
        <>
          <View style={styles.searchArea}>
            <TextInput
              style={styles.search}
              placeholder="Ürün ara..."
              placeholderTextColor="#888"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryBar}
          >
            {categories.map(item => (
              <TouchableOpacity
                key={item}
                onPress={() => setCategory(item)}
                style={[
                  styles.category,
                  category === item && styles.categorySelected,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === item && styles.categoryTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.heading}>Senin için seçtiklerimiz ✨</Text>

            {loading ? (
              <ActivityIndicator size="large" color="#f5a623" />
            ) : filteredProducts.length === 0 ? (
              <Text style={styles.empty}>
                Ürün bulunamadı. Aramanı veya kategoriyi değiştir.
              </Text>
            ) : (
              <View style={styles.grid}>
                {filteredProducts.map(product => (
                  <View key={product.id} style={styles.productCard}>
                    {product.image_url ? (
                      <Image
                        source={{ uri: product.image_url }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Text style={{ fontSize: 38 }}>🛍️</Text>
                      </View>
                    )}
                    <Text style={styles.productName} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text style={styles.description} numberOfLines={2}>
                      {product.description || 'BULZOVİK’te seni bekliyor.'}
                    </Text>
                    <Text style={styles.price}>
                      {Number(product.price).toLocaleString('tr-TR')} TL
                    </Text>
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => addToCart(product)}
                    >
                      <Text style={styles.primaryButtonText}>
                        Sepete ekle
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.refresh} onPress={loadProducts}>
              <Text style={styles.refreshText}>↻ Ürünleri yenile</Text>
            </TouchableOpacity>
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  header: {
    backgroundColor: '#151a2d',
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  logo: { color: '#f5a623', fontSize: 29, fontWeight: '900', letterSpacing: 2 },
  tagline: { color: '#fff', marginTop: 3, fontSize: 13 },
  cartButton: {
    position: 'absolute',
    right: 14,
    top: 25,
    backgroundColor: '#f5a623',
    borderRadius: 10,
    padding: 10,
  },
  cartButtonText: { color: '#151a2d', fontWeight: 'bold' },
  searchArea: { paddingHorizontal: 14, paddingTop: 14 },
  search: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e4e5eb',
  },
  categoryBar: { maxHeight: 55, marginTop: 8, paddingLeft: 10 },
  category: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignSelf: 'center',
  },
  categorySelected: { backgroundColor: '#151a2d' },
  categoryText: { color: '#333', fontWeight: '600' },
  categoryTextSelected: { color: '#fff' },
  content: { padding: 12, paddingBottom: 35 },
  heading: { fontSize: 21, fontWeight: '800', color: '#151a2d', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  productCard: {
    width: '48.5%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ececf1',
  },
  productImage: { width: '100%', height: 125, borderRadius: 9, backgroundColor: '#eee' },
  imagePlaceholder: {
    height: 125,
    backgroundColor: '#f0f1f6',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productName: { fontSize: 15, fontWeight: '700', color: '#202337', marginTop: 9 },
  description: { fontSize: 12, color: '#737789', marginTop: 4, minHeight: 30 },
  price: { color: '#db7e00', fontSize: 17, fontWeight: '900', marginTop: 8 },
  primaryButton: {
    backgroundColor: '#f5a623',
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: { color: '#151a2d', fontWeight: '800' },
  empty: { textAlign: 'center', color: '#777', padding: 24, fontSize: 15 },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  quantityButton: {
    color: '#151a2d',
    fontSize: 24,
    fontWeight: '900',
    paddingHorizontal: 7,
  },
  quantity: { fontWeight: '800', fontSize: 16 },
  total: { fontSize: 21, fontWeight: '900', textAlign: 'right', marginTop: 15 },
  refresh: { padding: 14, alignItems: 'center' },
  refreshText: { color: '#454c65', fontWeight: '700' },
});
