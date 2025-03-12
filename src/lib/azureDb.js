import { container } from '@/config/azure';

export async function createItem(item) {
  const { resource: createdItem } = await container.items.create(item);
  console.log(`Created item: ${createdItem.id}`);
}

export async function readItem(id) {
  const { resource: item } = await container.item(id).read();
  console.log(`Read item: ${item.id}`);
  return item;
}

export async function updateItem(id, updatedItem) {
  const { resource: item } = await container.item(id).replace(updatedItem);
  console.log(`Updated item: ${item.id}`);
}

export async function deleteItem(id) {
  await container.item(id).delete();
  console.log(`Deleted item: ${id}`);
}