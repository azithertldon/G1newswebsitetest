(() => {
	const config = window.firebaseConfig || {};
	const configured = config.apiKey && !config.apiKey.startsWith('PASTE_') && window.firebase;
	let database = null;
	let storage = null;

	if (configured) {
		firebase.initializeApp(config);
		database = firebase.firestore();
		storage = firebase.storage();
	}

	window.newsFirebase = {
		enabled: Boolean(configured),
		async loadStories() {
			if (!database) return null;
			const snapshot = await database.collection('stories').orderBy('createdAt', 'desc').get();
			return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
		},
		async saveStory(story, imageFile, existingId = null, existingImage = '') {
			if (!database) return null;
			const storyId = existingId || database.collection('stories').doc().id;
			let image = existingImage;
			if (imageFile && storage) {
				const imageRef = storage.ref(`story-images/${storyId}-${imageFile.name}`);
				await imageRef.put(imageFile);
				image = await imageRef.getDownloadURL();
			}
			const record = { ...story, image, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
			if (!existingId) record.createdAt = firebase.firestore.FieldValue.serverTimestamp();
			await database.collection('stories').doc(storyId).set(record, { merge: true });
			return { id: storyId, ...story, image };
		},
		async deleteStory(storyId) {
			if (database && storyId) await database.collection('stories').doc(storyId).delete();
		},
	};
})();
