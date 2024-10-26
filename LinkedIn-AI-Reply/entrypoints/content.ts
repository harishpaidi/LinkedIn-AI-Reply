// Importing necessary assets (icons) for the extension UI
import EditIcon from "~/assets/editicon.svg";
import InsertIcon from "~/assets/inserticon.svg";
import GenerateIcon from "~/assets/generateicon.svg";
import RegenerateIcon from "~/assets/regenerateicon.svg";

// Main content script definition, targeting LinkedIn pages
export default defineContentScript({
  matches: ["*://*.linkedin.com/*"], // Matches LinkedIn domain URLs
  main() {
    // HTML template for the custom modal
    const modalHtml = `
      <div id="custom-modal" style="position: fixed; inset: 0; display: none; justify-content: center; align-items: center; z-index: 4000;">
        <div id="modal-background" style="position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5);"></div> <!-- Background overlay -->
        <div id="modal-content" style="background: white; border-radius: 8px; width: 100%; max-width: 570px; padding: 20px; position: relative; z-index: 4001;">
          <div id="messages" style="margin-top: 10px; max-height: 200px; overflow-y: auto; padding: 10px; display: flex; flex-direction: column;"></div>
          <div style="margin-bottom: 10px;">
            <input id="input-text" type="text" placeholder="Enter your prompt..." style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"/>
          </div>
          <div style="text-align: right; margin-top: 12px;">
            <button id="insert-btn" style="background: #fff; color: #666D80; padding: 8px 16px; border: 2px solid #666D80; border-radius: 4px; cursor: pointer; display: none; margin-right: 10px;">
              <img src="${InsertIcon}" alt="Insert" style="vertical-align: middle; margin-right: 5px; width: 14px; height: 14px;"> 
              <b>Insert</b>
            </button>
            <button id="generate-btn" style="background: #007bff; color: white; padding: 8px 16px; border: 2px solid #007bff; border-radius: 4px; cursor: pointer;">
              <img src="${GenerateIcon}" alt="Generate" style="vertical-align: middle; margin-right: 5px; width: 14px; height: 14px"> 
              <b>Generate</b>
            </button>
          </div>
        </div>
      </div>
    `;

    // Append the modal to the document body
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // Cache modal elements
    const modal = document.getElementById("custom-modal") as HTMLDivElement;
    const modalBackground = document.getElementById("modal-background") as HTMLDivElement;
    const generateBtn = document.getElementById("generate-btn") as HTMLButtonElement;
    const insertBtn = document.getElementById("insert-btn") as HTMLButtonElement;
    const inputText = document.getElementById("input-text") as HTMLInputElement;
    const messagesDiv = document.getElementById("messages") as HTMLDivElement;

    let lastGeneratedMessage = "";
    let parentElement: HTMLElement | null = null;

    // Function to generate a default message
    const generateMessage = () => {
      return "Thank you for the opportunity! If you have any more questions or if there's anything else I can help you with, feel free to ask.";
    };

    // Function to handle focus on the LinkedIn message input
    const handleFocusOnMessageInput = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches(".msg-form__contenteditable") || target.closest(".msg-form__contenteditable")) {
        parentElement = target.closest(".msg-form__container") || target.closest(".msg-form__contenteditable");

        if (parentElement && !parentElement.querySelector(".edit-icon")) {
          const icon = document.createElement("img");
          icon.className = "edit-icon";
          icon.src = EditIcon;
          icon.alt = "AI Icon";
          icon.style.position = "absolute";
          icon.style.bottom = "5px";
          icon.style.right = "5px";
          icon.style.width = "30px";
          icon.style.height = "30px";
          icon.style.cursor = "pointer";
          icon.style.zIndex = "1000";
          parentElement.appendChild(icon);

          // Add event listener to the icon
          icon.addEventListener("click", (e) => {
            e.stopPropagation();
            modal.style.display = "flex";
          });
        }
      }
    };

    // Function to handle blur on the LinkedIn message input
    const handleBlurOnMessageInput = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches(".msg-form__contenteditable") || target.closest(".msg-form__contenteditable")) {
        parentElement = target.closest(".msg-form__container") || target.closest(".msg-form__contenteditable");

        if (parentElement && parentElement.querySelector(".edit-icon")) {
          parentElement.querySelector(".edit-icon")?.remove();
        }
      }
    };

    // Function to handle generate button clicks
    const handleGenerateButtonClick = (e: MouseEvent) => {
      e.stopPropagation();

      const inputValue = inputText.value.trim();
      if (!inputValue) return;

      const userMessageDiv = document.createElement("div");
      userMessageDiv.textContent = inputValue;
      Object.assign(userMessageDiv.style, {
        backgroundColor: "#DFE1E7",
        color: "#666D80",
        borderRadius: "12px",
        padding: "10px",
        marginBottom: "5px",
        textAlign: "right",
        maxWidth: "80%",
        alignSelf: "flex-end",
        marginLeft: "auto",
      });
      messagesDiv.appendChild(userMessageDiv);

      generateBtn.disabled = true;
      generateBtn.textContent = "Loading...";
      generateBtn.style.backgroundColor = "#666D80";

      setTimeout(() => {
        lastGeneratedMessage = generateMessage();
        const generatedMessageDiv = document.createElement("div");
        generatedMessageDiv.textContent = lastGeneratedMessage;
        Object.assign(generatedMessageDiv.style, {
          backgroundColor: "#DBEAFE",
          color: "#666D80",
          borderRadius: "12px",
          padding: "10px",
          marginBottom: "5px",
          textAlign: "left",
          maxWidth: "80%",
          alignSelf: "flex-start",
          marginRight: "auto",
        });

        messagesDiv.appendChild(generatedMessageDiv);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        generateBtn.disabled = false;
        generateBtn.style.backgroundColor = "#007bff";
        generateBtn.style.color = "white";
        generateBtn.innerHTML = `<img src="${RegenerateIcon}" alt="Regenerate" style="vertical-align: middle; margin-right: 5px; width: 16px; height: 16px"> <b>Regenerate</b>`;

        inputText.value = "";
        insertBtn.style.display = "inline-block";
      }, 500);
    };

    // Function to handle insert button clicks
    const handleInsertButtonClick = () => {
      if (lastGeneratedMessage && parentElement) {
        parentElement.removeAttribute("aria-label");

        let existingParagraph = parentElement.querySelector("p");

        if (!existingParagraph) {
          existingParagraph = document.createElement("p");
          parentElement.appendChild(existingParagraph);
        }

        existingParagraph.textContent = lastGeneratedMessage;

        insertBtn.style.display = "none";
        modal.style.display = "none";
      }
    };

    // Add event listeners
    document.addEventListener("focus", handleFocusOnMessageInput as EventListener, true);
    document.addEventListener("blur", handleBlurOnMessageInput as EventListener, true);
    generateBtn.addEventListener("click", handleGenerateButtonClick);
    insertBtn.addEventListener("click", handleInsertButtonClick);

    // Close the modal if the user clicks outside of it
    modalBackground.addEventListener("click", () => {
      modal.style.display = "none";
      insertBtn.style.display = "none";
    });
  },
});
