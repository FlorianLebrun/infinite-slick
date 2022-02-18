export default {
  type: "component",
  properties: {
    "x": {
      type: "string"
    }
  },
  result: {
    type: "element",
    view: {
      $ref: "module:#div",
    },
    inlaid: true,
    props: {
      "style": {
        type: "constant",
        value: {
          "backgroundColor": "#bbb",
        }
      },
      "children": {
        type: "list",
        items: [
          "root: ",
          { $ref: "/x/a" },
          {
            type: "element",
            view: {
              $ref: "module:#span",
            },
            props: {
              "style": {
                type: "collection",
                values: {
                  "backgroundColor": "#999",
                }
              },
              "children": {
                type: "list",
                items: [
                  "sub: ",
                  { $ref: "/x/b" }
                ]
              }
            }
          }, {
            type: "inline",
            name: "view1",
            result: {
              type: "element",
              view: {
                $ref: "module:#span",
              },
              inlaid: true,
              props: {
                "style": {
                  type: "collection",
                  values: {
                    "backgroundColor": "#999",
                  }
                },
                "children": {
                  type: "list",
                  items: [
                    "Other text",
                    { $ref: "/x/c" }
                  ]
                }
              }
            }
          }
        ]
      }
    }
  }
}