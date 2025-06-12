
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register Hebrew font (using built-in Helvetica for now, can be upgraded later)
Font.register({
  family: 'Helvetica',
  src: 'Helvetica'
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
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  infoSection: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  infoText: {
    fontSize: 12,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  itemContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fafafa',
    borderLeft: '3px solid #007acc',
  },
  customerName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  address: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  orderDetails: {
    fontSize: 12,
    color: '#333',
  },
  summarySection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#e8f4f8',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 12,
    marginBottom: 5,
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
          <Text style={styles.infoText}>תאריך הדפסה: {new Date().toLocaleDateString('he-IL')}</Text>
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
                  הזמנה #{order.ordernumber} • ₪{order.totalorder.toLocaleString()}
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
                  החזרה #{returnItem.returnnumber} • ₪{returnItem.totalreturn.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>סיכום</Text>
          <Text style={styles.summaryText}>
            סה"כ הזמנות: {orders.length} פריטים (₪{totalOrdersAmount.toLocaleString()})
          </Text>
          <Text style={styles.summaryText}>
            סה"כ החזרות: {returns.length} פריטים (₪{totalReturnsAmount.toLocaleString()})
          </Text>
          <Text style={styles.summaryText}>
            סה"כ כללי: ₪{(totalOrdersAmount - totalReturnsAmount).toLocaleString()}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
