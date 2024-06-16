import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getFoldersAPI, getFilesAPI } from "../services/apis";
import ContextMenu from "../components/ContextMenu";
import Modal from "../components/Modal"; // Import the modal component
import toast from "react-hot-toast";
import { LineWave } from "react-loader-spinner";

function Dashboard() {
  const [items, setItems] = useState([]);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null); // State to handle the selected file for modal
  const [loading, setLoading] = useState(true);
  const { parentFolderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchItems = async () => {
    try {
      const folderRes = await axios.get(getFoldersAPI, {
        withCredentials: true,
        params: { parentFolderId },
      });

      const fileRes = await axios.get(getFilesAPI, {
        withCredentials: true,
        params: { parentFolderId },
      });

      if (folderRes.data.success && fileRes.data.success) {          
        const combinedItems = [
          ...folderRes.data.data.map((folder) => ({
            ...folder,
            type: "folder",
          })),
          ...fileRes.data.data.map((file) => ({ ...file, type: "file" })),
        ];
        
        setLoading(false);
        setItems(combinedItems);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred.");
    }
  };

  useEffect(() => {
    fetchItems();
  }, [parentFolderId]);

  const handleRightClick = (event) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleFolderClick = (folderId) => {
    navigate(`/dashboard/${folderId}`);
  };

  const handleFileClick = (file) => {
    setSelectedFile(file);
  };

  const handleCloseModal = () => {
    setSelectedFile(null);
  };

  // const handleBackClick = () => {
  //   navigate(-1);
  // };

  if (loading) {
    return <LineWave color="black" />;
  }

  return (
    <div onContextMenu={handleRightClick} className="w-screen h-screen p-8">
      {/* <button onClick={handleBackClick}>Back</button> */}
      <div className="item-list">
        {items.map((item) =>
          item.type === "folder" ? (
            <div
              key={item._id}
              className="folder-item"
              onClick={() => handleFolderClick(item._id)}
            >
              {item.name}
            </div>
          ) : (
            <div
              key={item._id}
              className="file-item"
              onClick={() => handleFileClick(item)}
            >
              <img
                src={item.url}
                alt={item.name}
                style={{ width: "100px", height: "100px", objectFit: "cover" }}
              />
              <div>{item.name}</div>
            </div>
          )
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          mouseX={contextMenu.mouseX}
          mouseY={contextMenu.mouseY}
          handleClose={handleCloseContextMenu}
          parentFolderId={parentFolderId}
          refreshItems={fetchItems}
        />
      )}

      {selectedFile && (
        <Modal file={selectedFile} handleClose={handleCloseModal} />
      )}
    </div>
  );
}

export default Dashboard;
