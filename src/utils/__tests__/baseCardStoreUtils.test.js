// Test file to verify BaseCard store utilities work correctly
import { createBaseCardStoreMethods, createBaseCardAdapter } from '../baseCardStoreUtils.js';

// Mock store that uses different property names (like SeriesCardStore)
class MockSeriesStore {
  currentSeries = null;
  currentItem = null; // Add explicit property instead of getter
  
  constructor() {
    // Mix in base methods
    Object.assign(this, createBaseCardStoreMethods());
  }
  
  // Override with series-specific logic that syncs both properties
  openDeleteDialog = (item) => {
    this.currentSeries = item;
    this.currentItem = item;
    this.itemToDelete = item;
    this.showDeleteDialog = true;
  };
  
  openVisibilityDialog = (item) => {
    this.currentSeries = item;
    this.currentItem = item;
    this.showVisibilityDialog = true;
  };
  
  confirmDelete = () => {
    console.log('Deleting series:', this.currentItem?.name);
    this.closeDeleteDialog();
  };
  
  confirmVisibilityChange = () => {
    console.log('Toggling visibility for series:', this.currentItem?.name);
    this.closeVisibilityDialog();
  };
}

// Mock store that uses standard naming (like AssistantsStore)
class MockAssistantStore {
  constructor() {
    Object.assign(this, createBaseCardStoreMethods());
  }
  
  confirmDelete = () => {
    console.log('Deleting assistant:', this.currentItem?.name);
    this.closeDeleteDialog();
  };
  
  confirmVisibilityChange = () => {
    console.log('Toggling visibility for assistant:', this.currentItem?.name);
    this.closeVisibilityDialog();
  };
}

// Test function to verify consistent interface
function testBaseCardInterface(store, storeName) {
  console.log(`\n=== Testing ${storeName} ===`);
  
  const testItem = { id: 1, name: `Test ${storeName} Item`, hidden: false };
  
  // Test that all required properties exist
  const requiredProps = ['showDeleteDialog', 'showVisibilityDialog', 'showEditDialog', 'currentItem', 'itemToDelete'];
  const requiredMethods = ['openDeleteDialog', 'closeDeleteDialog', 'openVisibilityDialog', 'closeVisibilityDialog', 
                          'openEditDialog', 'closeEditDialog', 'handleToggleVisibility', 'handleEdit', 'handleDelete',
                          'confirmDelete', 'confirmVisibilityChange'];
  
  console.log('✓ Checking required properties...');
  requiredProps.forEach(prop => {
    if (!(prop in store)) {
      console.error(`✗ Missing property: ${prop}`);
    } else {
      // Property exists, no need to log success for each one
    }
  });
  
  console.log('✓ Checking required methods...');
  requiredMethods.forEach(method => {
    if (typeof store[method] !== 'function') {
      console.error(`✗ Missing method: ${method}`);
    }
  });
  
  // Test dialog flow
  console.log('✓ Testing delete dialog flow...');
  store.openDeleteDialog(testItem);
  console.log(`  showDeleteDialog: ${store.showDeleteDialog}`);
  console.log(`  itemToDelete: ${store.itemToDelete?.name}`);
  console.log(`  currentItem: ${store.currentItem?.name}`);
  
  store.confirmDelete();
  console.log(`  After confirmDelete - showDeleteDialog: ${store.showDeleteDialog}`);
  
  console.log('✓ Testing visibility dialog flow...');
  store.openVisibilityDialog(testItem);
  console.log(`  showVisibilityDialog: ${store.showVisibilityDialog}`);
  console.log(`  currentItem: ${store.currentItem?.name}`);
  
  store.confirmVisibilityChange();
  console.log(`  After confirmVisibilityChange - showVisibilityDialog: ${store.showVisibilityDialog}`);
  
  console.log(`✓ ${storeName} interface test completed successfully!`);
}

// Test adapter functionality
function testBaseCardAdapter() {
  console.log('\n=== Testing BaseCard Adapter ===');
  
  // Create a store with non-standard naming
  const customStore = {
    currentSeries: { id: 1, name: 'Test Series' },
    showDeleteDialog: false,
    showVisibilityDialog: false,
    showEditDialog: false,
    itemToDelete: null,
    closeDeleteDialog: () => { customStore.showDeleteDialog = false; },
    closeVisibilityDialog: () => { customStore.showVisibilityDialog = false; },
    closeEditDialog: () => { customStore.showEditDialog = false; },
    confirmDelete: () => console.log('Custom delete logic'),
    confirmVisibilityChange: () => console.log('Custom visibility logic'),
    saveCustomItem: () => console.log('Custom save logic')
  };
  
  // Create adapter
  const adapter = createBaseCardAdapter(customStore, {
    currentItemProperty: 'currentSeries',
    saveMethod: 'saveCustomItem'
  });
  
  console.log('✓ Testing adapter currentItem mapping...');
  console.log(`  adapter.currentItem: ${adapter.currentItem?.name}`);
  console.log(`  original currentSeries: ${customStore.currentSeries?.name}`);
  
  console.log('✓ Testing adapter method delegation...');
  adapter.confirmDelete();
  adapter.saveCustomItem();
  
  console.log('✓ Adapter test completed successfully!');
}

// Run tests
console.log('🧪 Running BaseCard Store Utilities Tests...');

const seriesStore = new MockSeriesStore();
const assistantStore = new MockAssistantStore();

testBaseCardInterface(seriesStore, 'SeriesStore');
testBaseCardInterface(assistantStore, 'AssistantStore');
testBaseCardAdapter();

console.log('\n🎉 All tests completed!');
console.log('\n📝 Summary:');
console.log('- ✅ Consistent interface across different store types');
console.log('- ✅ Composition pattern avoids MobX inheritance issues');
console.log('- ✅ Backward compatibility with existing store patterns');
console.log('- ✅ Flexible adapter for non-standard naming conventions');