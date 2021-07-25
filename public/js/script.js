// console.log("Working");

Vue.component("modal-component", {
    template: "#modal-template",
    props: ["imageId"],
    data: function () {
        return {
            description: "",
            username: "",
            title: "",
            url: "",
            previousId: "",
            nextId: "",
            created_at: "",
        };
    },
    mounted: function () {
        // console.log("this.imageId: ", this.imageId);
        this.getImage();
    },
    watch: {
        imageId: function () {
            this.getImage();
        },
    },
    // updated: function () {
    //     this.getImage();
    // },
    methods: {
        closeModal: function () {
            // console.log("working when clicked");
            this.$emit("close");
        },
        previousImage: function () {
            // console.log("this.previousId", this.previousId);
            location.hash = this.previousId;
            // console.log("Previous Click is Working..! Wohooo");
            // this.$emit("previousimage");
        },
        nextImage: function () {
            // console.log("this.nextId", this.nextId);
            // console.log("Next Click is Working..! Wohooo");
            location.hash = this.nextId;
        },
        getImage: function () {
            axios
                .get(`/image/${this.imageId}`)
                .then(({ data }) => {
                    // console.log("data at mounted GET/images:", data);
                    this.description = data.description;
                    this.username = data.username;
                    this.title = data.title;
                    this.url = data.url;
                    this.previousId = data.previous;
                    this.nextId = data.next;
                    this.created_at = new Date(data.created_at)
                        .toUTCString()
                        .replace("GMT", "");
                })
                .catch((error) => console.log("error: ", error));
        },
    },
});

Vue.component("comment-component", {
    template: "#comment-template",
    props: ["imageId"],
    data: function () {
        return {
            comments: [],
            username: "",
            comment: "",
        };
    },
    mounted: function () {
        this.getComment();
    },
    watch: {
        imageId: function () {
            this.getComment();
        },
    },
    // updated: function () {
    //     this.getComment();
    // },
    methods: {
        addComment: function () {
            // console.log("Adding Comment");
            axios
                .post("/comment", {
                    username: this.username,
                    comment_text: this.comment,
                    image_id: this.imageId,
                })
                .then((response) => {
                    // console.log("response:", response);
                    this.comments.unshift(response.data);
                    this.username = "";
                    this.comment = "";
                })
                .catch((error) => {
                    console.log("Error in axios POST /comment route", error);
                });
        },
        getComment: function () {
            axios
                .get(`/comments/${this.imageId}`)
                .then((response) => {
                    // console.log("Response in /GET:", response.data);
                    this.comments = response.data;
                })
                .catch((err) =>
                    console.log("Error in axios GET /comment route", err)
                );
        },
    },
});

new Vue({
    el: "#main",
    data: {
        renderComponent: false,
        images: [],
        description: "",
        username: "",
        title: "",
        file: null,
        seen: false,
        imageId: null,
    },
    mounted: function () {
        // console.log("MOUNTED");
        axios.get("/image").then((response) => {
            // console.log("response.data:", response.data);
            this.images = response.data.images;
        });
        // console.log("this.images:", this.images);

        if (location.hash) {
            this.toggleImage(location.hash.slice(1));
        }
        addEventListener("hashchange", () => {
            // console.log("location.hash.slice(1):", location.hash.slice(1));
            this.toggleImage(location.hash.slice(1));
        });
    },

    methods: {
        handleChange: function (e) {
            console.log("e.target.file[0]", e.target.files[0]);
            this.file = e.target.files[0];
            console.log("this:", this);
        },
        submitFile: function (e) {
            e.preventDefault(); // preventDefault is going to stop my page being reloading..!
            // console.log("Submit File is running");

            // We'are going to use an API called FormData to send the file to server
            // FormData is only for files
            var formData = new FormData(); // we are var it with defining bcoz it is from browser
            formData.append("file", this.file);
            formData.append("title", this.title);
            formData.append("description", this.description);
            formData.append("username", this.username);

            //FormData always logs an empty object. That does not mean the appends didnt work
            // console.log("formData:", formData);

            // Next step : send this off to server
            axios
                .post("/upload", formData)
                .then((response) => {
                    // console.log("response received from server!!");
                    this.images.unshift(response.data);
                    this.title = "";
                    this.description = "";
                    this.username = "";
                    this.file = null;
                })
                .catch((error) => {
                    console.log(("error in POST /upload routes:", error));
                });
        },
        toggleImage: function (imageId) {
            // console.log("imageId", imageId);
            this.imageId = imageId;
        },
        closeModal: function () {
            this.imageId = null;
            location.hash = "";
            history.pushState({}, "", "/");
        },
        loadMoreImages: function () {
            // console.log("More button clicked");
            const lowestId = this.images[this.images.length - 1].id;
            axios.get(`/moreImages/${lowestId}`).then(({ data }) => {
                // console.log("/moreImages/${lowestId} .then(data):", data);
                for (let image in data) {
                    this.images.push(data[image]);
                }
                if (lowestId > 1) {
                    this.seen = false;
                } else {
                    this.seen = true;
                }
            });
        },
    },
});
