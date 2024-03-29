import {db, storage} from './config.js'
import {
    addDoc,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore'
import {deleteObject, getDownloadURL, listAll, ref, uploadBytes} from 'firebase/storage'
import {userId} from "@constants";
import {saveAs} from 'file-saver'


export const addNewUser = async (uid, email) => {
    const newUser = {
        likedTracks: [],
        email: email
    }

    await addDoc(collection(doc(db, "users", uid), "playlists"), {})
    await setDoc(doc(db, `users/${uid}`), newUser)
}

export const addNewPlaylist = async (uid, playlistId, title, imagePath) => {

    const newPlaylist = {
        id: playlistId,
        title: title,
        imagePath: imagePath,
        tracks: []
    }

    await addDoc(collection(db, `users/${uid}/playlists`), newPlaylist)
}

export const addNewPlaylistTrack = async (uid, playlistId, playlistPreview, trackId) => {

    const q =
        query(collection(db, `users/${uid}/playlists`),
        where('id', '==', playlistId))
    const getSelectedDoc = await getDocs(q)

    getSelectedDoc.forEach( (doc) => {
        updateDoc(doc.ref, { tracks: arrayUnion({trackId: trackId, preview_url: playlistPreview}) })
    })

    console.log("track added to playlist")
}

export const addLikedUserTrack = async (uid, trackId, previewUrl) => {
    const userDocRef = doc(db, `users/${uid}`)
    const userDoc = await getDoc(userDocRef)
    const userLikedTracks = userDoc.data().likedTracks
    if (!userLikedTracks.some(track => track.id === trackId)) {
        await updateDoc(userDocRef, { likedTracks: [...userLikedTracks, {id: trackId, url: previewUrl}] })
    }
    else {
        console.log("Трек уже добавлен")
    }
}

export const deletePlaylist = async (uid, playlistId) => {
    const playlistsCollectionRef = collection(db, `users/${uid}/playlists`);
    const q = query(playlistsCollectionRef, where('id', '==', playlistId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const playlistDocRef = doc(playlistsCollectionRef, querySnapshot.docs[0].id);
        await deleteDoc(playlistDocRef);
    }
}

export const deletePlaylistTrack = async (uid, playlistId, trackId) => {
    const q = query(collection(db, `users/${uid}/playlists`), where('id', '==', playlistId))

    const deletePlaylist = await getDocs(q)

    deletePlaylist.forEach( playlist => {
        const playlistData = playlist.data()
        if (playlist && playlistData) {
            let playlistTracks = playlistData.tracks
            const updatedTracks = playlistTracks.filter(track => track.trackId !== trackId)

            const playlistDoc = doc(db, `users/${uid}/playlists/${playlist.id}`)
            updateDoc(playlistDoc, {tracks: updatedTracks})
        }
    })
}

export const deleteLikedTrack = async (uid, trackId) => {
    const userRef = doc(db, `users/${uid}`)
    const userDoc = await getDoc(userRef)
    const userLikedTracks = userDoc.data().likedTracks || console.log(new Error("No tracks found"))

    await updateDoc(userRef, { likedTracks: userLikedTracks.filter(id => id !== trackId) })
}

export const getUserPlaylists = async (uid) => {
    let userPlaylists = []
    const userDocs = await getDocs(collection(db, `users/${uid}/playlists`))
    userDocs.forEach(playlist => {
        userPlaylists = [...userPlaylists, playlist.data()]
    })

    return userPlaylists
}

export const getPlaylistTracks = async (uid, playlistId) => {
    let userPlaylistTrackIds = []
    const q =
        query(collection(db, `users/${uid}/playlists`),
            where('id', '==', playlistId))

    const getSelectedDoc = await getDocs(q)

    getSelectedDoc.forEach( (doc) => userPlaylistTrackIds = doc.data()["tracks"])

    return userPlaylistTrackIds
}

export const getUserLikedTracks = async (uid) => {
    const userDoc = await getDoc(doc(db, `users/${uid}`))
    return await userDoc.data().likedTracks
}

export const getStorageImage = async (path) => {
    const imageRef = ref(storage, path)

    return await getDownloadURL(imageRef)
}

export const getAllTracks = async () => {
    let userTracks = [];
    const userStorageRef = ref(storage, `users/${userId}`);
    const sharedStorageRef = ref(storage, `sharedTracks/`);

    try {
        const [userResult, sharedResult] = await Promise.all([
            listAll(userStorageRef),
            listAll(sharedStorageRef)
        ]);

        const userPromises = userResult.items.map(async (fileRef) => {
            const url = await getDownloadURL(fileRef);
            return {
                name: fileRef.name,
                src: url
            };
        });

        const sharedPromises = sharedResult.items.map(async (fileRef) => {
            const url = await getDownloadURL(fileRef);
            return {
                name: fileRef.name,
                src: url
            };
        });

        const [userTracks, sharedTracks] = await Promise.all([
            Promise.all(userPromises),
            Promise.all(sharedPromises)
        ]);

        return [...userTracks, ...sharedTracks];
    } catch (error) {
        console.error('Error getting files from storage:', error);
        return userTracks;
    }
};

export const getStorageTrack = async (title) => {
    const storageRef = ref(storage, `users/${userId}/${title}`)

    return getDownloadURL(storageRef)
}

export const addStorageTrack = async (file) => {
    const fileRef = ref(storage, `users/${userId}/${file?.name}`)
    await uploadBytes(fileRef, file).then(() => console.log(`${file.name} added`))
}

export const deleteStorageTrack = async (fileName) => {
    const fileRef = ref(storage, `users/${userId}/${fileName}`)
    await deleteObject(fileRef).then(() => console.log(`${fileName} deleted`))
}

export const downloadAllStorageTracks = async () => {
    const userId = localStorage.getItem("currentUserId");
    const storageRef = ref(storage, `users/${userId}`);
    const sharedTracksRef = ref(storage, "sharedTracks");
    const tracksText = []; // Массив для хранения строк с информацией о треках

    try {
        const userResult = await listAll(storageRef);
        for (const fileRef of userResult.items) {
            const url = await getDownloadURL(fileRef);
            tracksText.push(`${tracksText.length + 1}. ${fileRef.name}. URL: ${url}\n`); // Добавление строки с информацией о треке
        }

        const sharedResult = await listAll(sharedTracksRef);
        for (const fileRef of sharedResult.items) {
            const url = await getDownloadURL(fileRef);
            tracksText.push(`${tracksText.length + 1}. ${fileRef.name}. URL: ${url}\n`); // Добавление строки с информацией о треке
        }

        const tracksTextContent = tracksText.join("\n");
        const tracksBlob = new Blob([tracksTextContent], { type: "text/plain" });

        saveAs(tracksBlob, `${userId}.txt`);
    } catch (error) {
        console.error('Error downloading files:', error);
    }
}



export const renameUserPlaylist = async (uid, playlistId, newTitle) => {
    try {
        const playlistsRef = collection(db, `users/${uid}/playlists`);
        const querySnapshot = await getDocs(query(playlistsRef, where('id', '==', playlistId)));

        if (!querySnapshot.empty) {
            const playlistDocRef = querySnapshot.docs[0].ref;
            await updateDoc(playlistDocRef, { title: newTitle });
            console.log(`Playlist ${playlistId} renamed to ${newTitle}`);
        } else {
            console.error('Playlist not found.');
        }
    } catch (error) {
        console.error('Error renaming playlist:', error);
    }
}
