# BaseCard Store Utilities

This utility provides a consistent interface for stores that work with the `BaseCard` component, solving the MobX inheritance limitations by using composition instead of inheritance.

## Problem Solved

The `BaseCard` component expects stores to have consistent properties and methods:
- `currentItem` - the currently selected item
- `showDeleteDialog`, `showVisibilityDialog`, `showEditDialog` - dialog states
- `closeDeleteDialog()`, `closeVisibilityDialog()`, `closeEditDialog()` - dialog close methods
- `confirmDelete()`, `confirmVisibilityChange()` - confirmation methods
- `saveItem()` or `saveAssistant()` - save methods

However, different stores had inconsistent naming:
- `SeriesCardStore` used `currentSeries` instead of `currentItem`
- `AssistantsStore` used `assistantToDelete` instead of `itemToDelete`
- Each store implemented dialog management differently

## Solution: Composition over Inheritance

Instead of using class inheritance (which has MobX observable issues), we use composition by mixing in methods from `createBaseCardStoreMethods()`.

## Usage

### 1. Import the utility

```javascript
import { createBaseCardStoreMethods } from '../utils/baseCardStoreUtils';
```

### 2. Mix in the methods in your store constructor

```javascript
class YourStore {
  // Your store-specific properties
  yourSpecificProperty = null;
  
  // Required: Explicit currentItem property (don't use getter to avoid conflicts)
  currentItem = null;

  constructor() {
    // Mix in base card store methods BEFORE makeAutoObservable
    Object.assign(this, createBaseCardStoreMethods());
    
    makeAutoObservable(this);
  }

  // If you need to sync currentItem with your specific property, override the dialog methods
  openDeleteDialog = (item) => {
    this.yourSpecificProperty = item;
    this.currentItem = item;
    this.itemToDelete = item;
    this.showDeleteDialog = true;
  };

  // Override base implementations with your specific logic
  confirmDelete = async () => {
    if (this.itemToDelete) {
      await yourDeleteAPI(this.itemToDelete.id);
      this.closeDeleteDialog();
    }
  };

  confirmVisibilityChange = async () => {
    if (this.currentItem) {
      await yourToggleVisibilityAPI(this.currentItem);
      this.closeVisibilityDialog();
    }
  };

  saveItem = async () => {
    // Your save logic here
    await yourSaveAPI(this.currentItem);
    this.closeEditDialog();
  };
}
```

### 3. Use with BaseCard component

```jsx
<BaseCard
  store={yourStore}
  itemType="yourItemType"
  renderDialogs={true}
  // ... other props
/>
```

## What the utility provides

### Properties
- `showDeleteDialog: false`
- `showVisibilityDialog: false`
- `showEditDialog: false`
- `currentItem: null`
- `itemToDelete: null`

### Methods
- `openDeleteDialog(item)`
- `closeDeleteDialog()`
- `openVisibilityDialog(item)`
- `closeVisibilityDialog()`
- `openEditDialog(item)`
- `closeEditDialog()`
- `handleToggleVisibility(item)` - calls `openVisibilityDialog`
- `handleEdit(item)` - calls `openEditDialog`
- `handleDelete(item)` - calls `openDeleteDialog` or `handleRestore` if item is deleted
- `confirmDelete()` - default implementation (should be overridden)
- `confirmVisibilityChange()` - default implementation (should be overridden)
- `saveItem()` - default implementation (should be overridden)

## Examples

See the updated stores for examples:
- `src/stores/seriesCardStore.js` - Shows how to map `currentSeries` to `currentItem`
- `src/stores/assistantsStore.js` - Shows integration with grouped store methods
- `src/stores/membershipStore.js` - Shows backward compatibility with existing methods

## Benefits

1. **Consistent Interface**: All stores now provide the same interface to `BaseCard`
2. **No MobX Issues**: Uses composition instead of inheritance
3. **Backward Compatibility**: Existing store methods still work
4. **Flexible**: Stores can override any method with their specific logic
5. **Maintainable**: Changes to base behavior only need to be made in one place