
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register Hebrew-supporting font
Font.register({
  family: 'NotoSansHebrew',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/notosanshebrew/v43/s2v5p1aL6TigO9nE-QiFnA.woff2',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/notosanshebrew/v43/s2v8p1aL6TigO9nE-QiFnIvPY.woff2',
      fontWeight: 'bold',
    }
  ]
});

// Fallback to Arial if Noto Sans Hebrew doesn't load
Font.register({
  family: 'Arial',
  src: 'https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1x4gaVQUwaEQbjB_mQ.woff2'
});

interface Order {
  ordernumber: number;
  customername: string;
  address: string;
  city: string;
  totalorder: number;
}

interface Return {
  returnnumber: number;
  customername: string;
  address: string;
  city: string;
  totalreturn: number;
}

interface ZonePDFDocumentProps {
  zoneNumber: number;
  scheduleId: number;
  groupName: string;
  driverName: string;
  orders: Order[];
  returns: Return[];
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'NotoSansHebrew',
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    fontFamily: 'NotoSansHebrew',
    direction: 'rtl',
  },
  infoSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
    direction: 'rtl',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'NotoSansHebrew',
    textAlign: 'right',
    direction: 'rtl',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 15,
    color: '#2c3e50',
    fontFamily: 'NotoSansHebrew',
    textAlign: 'right',
    direction: 'rtl',
    backgroundColor: '#ecf0f1',
    padding: 10,
    borderRadius: 3,
  },
  itemContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fdfdfd',
    borderRight: '4px solid #3498db',
    borderRadius: 3,
    direction: 'rtl',
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    fontFamily: 'NotoSansHebrew',
    textAlign: 'right',
    color: '#2c3e50',
    direction: 'rtl',
  },
  address: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 6,
    fontFamily: 'NotoSansHebrew',
    textAlign: 'right',
    direction: 'rtl',
  },
  orderDetails: {
    fontSize: 13,
    color: '#34495e',
    fontFamily: 'NotoSansHebrew',
    textAlign: 'right',
    direction: 'rtl',
  },
  summarySection: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#e8f6f3',
    borderRadius: 5,
    direction: 'rtl',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    fontFamily: 'NotoSansHebrew',
    textAlign: 'right',
    color: '#27ae60',
    direction: 'rtl',
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'NotoSansHebrew',
    textAlign: 'right',
    direction: 'rtl',
    color: '#2c3e50',
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    fontFamily: 'NotoSansHebrew',
    textAlign: 'right',
    direction: 'rtl',
    color: '#e74c3c',
  },
});

export const ZonePDFDocument: React.FC<ZonePDFDocumentProps> = ({
  zoneNumber,
  scheduleId,
  groupName,
  driverName,
  orders,
  returns,
}) => {
  const totalOrdersAmount = orders.reduce((sum, order) => sum + order.totalorder, 0);
  const totalReturnsAmount = returns.reduce((sum, returnItem) => sum + returnItem.totalreturn, 0);
  const netTotal = totalOrdersAmount - totalReturnsAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.title}>
          אזור {zoneNumber} - {groupName || 'לא מוגדר'}
        </Text>

        {/* Schedule Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>מזהה לוח זמנים: {scheduleId}</Text>
          <Text style={styles.infoText}>נהג: {driverName || 'לא מוגדר'}</Text>
          <Text style={styles.infoText}>
            תאריך הדפסה: {new Date().toLocaleDateString('he-IL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </Text>
          <Text style={styles.infoText}>
            שעת הדפסה: {new Date().toLocaleTimeString('he-IL', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>

        {/* Orders Section */}
        {orders.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>הזמנות ({orders.length})</Text>
            {orders.map((order, index) => (
              <View key={`order-${order.ordernumber}`} style={styles.itemContainer}>
                <Text style={styles.customerName}>
                  {index + 1}. {order.customername}
                </Text>
                <Text style={styles.address}>
                  {order.address}, {order.city}
                </Text>
                <Text style={styles.orderDetails}>
                  מספר הזמנה: {order.ordernumber} • סכום: ₪{order.totalorder.toLocaleString('he-IL')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Returns Section */}
        {returns.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>החזרות ({returns.length})</Text>
            {returns.map((returnItem, index) => (
              <View key={`return-${returnItem.returnnumber}`} style={styles.itemContainer}>
                <Text style={styles.customerName}>
                  {index + 1}. {returnItem.customername}
                </Text>
                <Text style={styles.address}>
                  {returnItem.address}, {returnItem.city}
                </Text>
                <Text style={styles.orderDetails}>
                  מספר החזרה: {returnItem.returnnumber} • סכום: ₪{returnItem.totalreturn.toLocaleString('he-IL')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>סיכום אזור {zoneNumber}</Text>
          <Text style={styles.summaryText}>
            סך הכל הזמנות: {orders.length} פריטים • סכום: ₪{totalOrdersAmount.toLocaleString('he-IL')}
          </Text>
          <Text style={styles.summaryText}>
            סך הכל החזרות: {returns.length} פריטים • סכום: ₪{totalReturnsAmount.toLocaleString('he-IL')}
          </Text>
          <Text style={styles.totalText}>
            סך הכל נטו: ₪{netTotal.toLocaleString('he-IL')}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
