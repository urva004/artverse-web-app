import axios from 'axios';

async function testPut() {
  try {
    const formData = new FormData();
    formData.append("title", "digital art");
    formData.append("description", "this is my first digital artwork");
    formData.append("price", "699");
    formData.append("stock", "1");
    // "DIGITAL_ART" is the enum
    formData.append("category", "DIGITAL_ART");
    formData.append("tags", JSON.stringify(["digital art"]));

    // Need a token! I can't guess token. Wait, what if I bypass it?
    // I can't bypass authentication without changing the backend.
  } catch(e) {
    console.error(e);
  }
}

testPut();
