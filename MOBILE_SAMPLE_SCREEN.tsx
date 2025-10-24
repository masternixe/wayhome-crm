// 📱 Sample Mobile Screen - Properties List
// This shows how to convert your web components to mobile

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/apiService';

interface Property {
  id: string;
  title: string;
  city: string;
  zona: string;
  price: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  siperfaqeMin: number;
  siperfaqeMax: number;
  gallery: string[];
  listingType: 'SALE' | 'RENT';
  featured: boolean;
}

export default function PropertiesScreen({ navigation }: any) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const response = await apiService.getProperties();
      if (response.success) {
        setProperties(response.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProperties();
    setRefreshing(false);
  };

  const renderProperty = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={styles.propertyCard}
      onPress={() => navigation.navigate('PropertyDetail', { id: item.id })}
    >
      {/* Property Image */}
      <View style={styles.imageContainer}>
        {item.gallery && item.gallery.length > 0 ? (
          <Image source={{ uri: item.gallery[0] }} style={styles.propertyImage} />
        ) : (
          <View style={[styles.propertyImage, styles.placeholderImage]}>
            <Ionicons name="home" size={40} color="#ccc" />
          </View>
        )}
        
        {/* Property Badges */}
        <View style={styles.badgeContainer}>
          <View style={[
            styles.badge,
            { backgroundColor: item.listingType === 'SALE' ? '#10b981' : '#3b82f6' }
          ]}>
            <Text style={styles.badgeText}>
              {item.listingType === 'SALE' ? 'Shitje' : 'Qira'}
            </Text>
          </View>
          {item.featured && (
            <View style={[styles.badge, { backgroundColor: '#f59e0b' }]}>
              <Text style={styles.badgeText}>PREMIUM</Text>
            </View>
          )}
        </View>
      </View>

      {/* Property Info */}
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color="#6b7280" />
          <Text style={styles.locationText}>
            {item.city} • {item.zona}
          </Text>
        </View>

        {/* Price */}
        <Text style={styles.price}>
          €{item.price.toLocaleString()}
        </Text>

        {/* Property Features */}
        <View style={styles.featuresRow}>
          <View style={styles.feature}>
            <Ionicons name="bed" size={16} color="#6b7280" />
            <Text style={styles.featureText}>{item.bedrooms}</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="water" size={16} color="#6b7280" />
            <Text style={styles.featureText}>{item.bathrooms}</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="resize" size={16} color="#6b7280" />
            <Text style={styles.featureText}>
              {item.siperfaqeMin}-{item.siperfaqeMax}m²
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pronat</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddProperty')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Properties List */}
      <FlatList
        data={properties}
        renderItem={renderProperty}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="home" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nuk ka prona të disponueshme</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#f59e0b',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  propertyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  propertyImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  placeholderImage: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  propertyInfo: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 12,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
});
